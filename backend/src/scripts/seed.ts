import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Para soportar __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvDir = path.resolve(__dirname, '../../../public/data');
const indexFilePath = path.join(csvDir, 'data_index.json');

// Funciones de parseo idénticas a las del frontend original
function parseTags(input: string | undefined, returnHighest: boolean = false): string[] {
  if (!input) return [];

  const parts = input.split(';').map((entry) => {
    const [tag, value] = entry.split(':');
    if (value === undefined) {
      return { tag: tag.trim() };
    }
    return {
      tag: tag.trim(),
      value: parseFloat(value),
    };
  });

  if (returnHighest) {
    const validParts = parts.filter((part) => part.value !== undefined);
    if (validParts.length === 0) return [];
    const highest = validParts.reduce((a, b) => ((a.value ?? 0) > (b.value ?? 0) ? a : b));
    return [highest.tag];
  }

  return parts.map((p) => p.tag);
}

async function main() {
  console.log('Iniciando proceso de migración de datos...');
  
  if (!fs.existsSync(indexFilePath)) {
    console.error(`Error: No se encontró el archivo de índice en: ${indexFilePath}`);
    process.exit(1);
  }

  const csvFiles: string[] = JSON.parse(fs.readFileSync(indexFilePath, 'utf-8'));
  console.log(`Archivos CSV detectados para importar: ${csvFiles.join(', ')}`);

  // Estructuras temporales para consolidar datos en memoria
  const rawImages: Array<{
    filename: string;
    createdAt: Date;
    ratingName: string | null;
    tagNames: string[];
    characterNames: string[];
  }> = [];

  const allTags = new Set<string>();
  const allCharacters = new Set<string>();
  const allRatings = new Set<string>();

  // 1. Leer y parsear todos los archivos CSV
  for (const csvFile of csvFiles) {
    const csvPath = path.join(csvDir, csvFile);
    if (!fs.existsSync(csvPath)) {
      console.warn(`Advertencia: Saltando ${csvFile} porque no existe.`);
      continue;
    }

    console.log(`Parseando ${csvFile}...`);
    const csvText = fs.readFileSync(csvPath, 'utf-8');
    const parsed = Papa.parse<string[]>(csvText, {
      delimiter: ',',
      skipEmptyLines: true,
    });

    for (const row of parsed.data) {
      if (row[0] === 'image' || !row[0]) continue; // Saltar cabecera o filas vacías
      
      const [image, created_at, ratings, character_tags, tags] = row;
      
      const parsedRatings = parseTags(ratings, true);
      const ratingName = parsedRatings.length > 0 ? parsedRatings[0] : null;
      const characterNames = parseTags(character_tags);
      const tagNames = parseTags(tags);

      if (ratingName) allRatings.add(ratingName);
      tagNames.forEach(t => allTags.add(t));
      characterNames.forEach(c => allCharacters.add(c));

      rawImages.push({
        filename: image,
        createdAt: new Date(created_at || new Date()),
        ratingName,
        tagNames,
        characterNames,
      });
    }
  }

  console.log(`Leídas ${rawImages.length} imágenes del archivo CSV.`);
  console.log(`Encontrados: ${allRatings.size} Ratings, ${allTags.size} Tags, ${allCharacters.size} Characters.`);

  // 2. Limpiar base de datos antes de importar (opcional, pero asegura idempotencia)
  console.log('Limpiando tablas de la base de datos...');
  await prisma.imageTag.deleteMany({});
  await prisma.imageCharacter.deleteMany({});
  await prisma.image.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.character.deleteMany({});
  await prisma.rating.deleteMany({});

  // 3. Crear Ratings en la base de datos
  console.log('Insertando Ratings...');
  await prisma.rating.createMany({
    data: Array.from(allRatings).map(name => ({ name })),
  });
  const ratingsInDb = await prisma.rating.findMany();
  const ratingMap = new Map(ratingsInDb.map(r => [r.name, r.id]));

  // 4. Crear Tags en la base de datos
  console.log('Insertando Tags...');
  const tagsData = Array.from(allTags).map(name => ({ name }));
  // Usar lotes para prevenir límites de variables en consultas Postgres
  const tagBatchSize = 10000;
  for (let i = 0; i < tagsData.length; i += tagBatchSize) {
    await prisma.tag.createMany({
      data: tagsData.slice(i, i + tagBatchSize),
      skipDuplicates: true,
    });
  }
  const tagsInDb = await prisma.tag.findMany({ select: { id: true, name: true } });
  const tagMap = new Map(tagsInDb.map(t => [t.name, t.id]));

  // 5. Crear Characters en la base de datos
  console.log('Insertando Characters...');
  const charactersData = Array.from(allCharacters).map(name => ({ name }));
  for (let i = 0; i < charactersData.length; i += tagBatchSize) {
    await prisma.character.createMany({
      data: charactersData.slice(i, i + tagBatchSize),
      skipDuplicates: true,
    });
  }
  const charactersInDb = await prisma.character.findMany({ select: { id: true, name: true } });
  const characterMap = new Map(charactersInDb.map(c => [c.name, c.id]));

  // 6. Crear Imágenes en la base de datos
  console.log('Insertando registros de imágenes...');
  const imagesData = rawImages.map(img => ({
    filename: img.filename,
    createdAt: img.createdAt,
    ratingId: img.ratingName ? ratingMap.get(img.ratingName) ?? null : null,
  }));

  const imageBatchSize = 5000;
  for (let i = 0; i < imagesData.length; i += imageBatchSize) {
    await prisma.image.createMany({
      data: imagesData.slice(i, i + imageBatchSize),
      skipDuplicates: true,
    });
  }

  // Obtener IDs de imágenes insertadas para asociar las relaciones muchos a muchos
  console.log('Recuperando IDs de imágenes insertadas...');
  const imagesInDb = await prisma.image.findMany({ select: { id: true, filename: true } });
  const imageMap = new Map(imagesInDb.map(img => [img.filename, img.id]));

  // 7. Crear relaciones muchos a muchos (ImageTag e ImageCharacter)
  console.log('Preparando relaciones muchos a muchos...');
  const imageTagsToInsert: Array<{ imageId: number; tagId: number }> = [];
  const imageCharactersToInsert: Array<{ imageId: number; characterId: number }> = [];

  for (const img of rawImages) {
    const imageId = imageMap.get(img.filename);
    if (!imageId) continue;

    for (const tagName of img.tagNames) {
      const tagId = tagMap.get(tagName);
      if (tagId) {
        imageTagsToInsert.push({ imageId, tagId });
      }
    }

    for (const charName of img.characterNames) {
      const characterId = characterMap.get(charName);
      if (characterId) {
        imageCharactersToInsert.push({ imageId, characterId });
      }
    }
  }

  console.log(`Insertando ${imageTagsToInsert.length} relaciones Image-Tag...`);
  const relationBatchSize = 10000;
  for (let i = 0; i < imageTagsToInsert.length; i += relationBatchSize) {
    await prisma.imageTag.createMany({
      data: imageTagsToInsert.slice(i, i + relationBatchSize),
      skipDuplicates: true,
    });
  }

  console.log(`Insertando ${imageCharactersToInsert.length} relaciones Image-Character...`);
  for (let i = 0; i < imageCharactersToInsert.length; i += relationBatchSize) {
    await prisma.imageCharacter.createMany({
      data: imageCharactersToInsert.slice(i, i + relationBatchSize),
      skipDuplicates: true,
    });
  }

  console.log('¡Migración completada con éxito!');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
