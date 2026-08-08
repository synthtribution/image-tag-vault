import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './db.js';

// Configurar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const IMAGES_DIR = process.env.IMAGES_DIR;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

if (!IMAGES_DIR) {
  console.error('Error: La variable de entorno IMAGES_DIR no está definida.');
  process.exit(1);
}

// Configurar CORS para permitir el frontend
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ['GET'],
  })
);

// Middleware JSON (opcional para el futuro)
app.use(express.json());

// Sirve los archivos estáticos de imágenes desde el disco local
app.use('/imagenes', express.static(IMAGES_DIR));

// Endpoint para obtener todas las imágenes indexadas en el formato que espera el frontend
app.get('/api/images', async (req, res) => {
  try {
    console.log('GET /api/images - Consultando base de datos...');
    const images = await prisma.image.findMany({
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        characters: {
          include: {
            character: true
          }
        },
        rating: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const mappedImages = images.map((img) => ({
      image: img.filename,
      created_at: img.createdAt.toISOString(),
      tags: img.tags.map((t) => t.tag.name),
      character_tags: img.characters.map((c) => c.character.name),
      ratings: img.rating ? [img.rating.name] : []
    }));

    res.json(mappedImages);
  } catch (error) {
    console.error('Error al obtener imágenes:', error);
    res.status(500).json({ error: 'Error interno del servidor al consultar imágenes.' });
  }
});

// Endpoint para obtener todas las etiquetas, personajes y clasificaciones consolidadas
app.get('/api/tags', async (req, res) => {
  try {
    console.log('GET /api/tags - Consolidando etiquetas...');
    
    // Obtener etiquetas generales
    const tags = await prisma.tag.findMany({
      select: {
        name: true,
        _count: {
          select: { images: true }
        }
      }
    });

    // Obtener personajes
    const characters = await prisma.character.findMany({
      select: {
        name: true,
        _count: {
          select: { images: true }
        }
      }
    });

    // Obtener clasificaciones (ratings)
    const ratings = await prisma.rating.findMany({
      select: {
        name: true,
        _count: {
          select: { images: true }
        }
      }
    });

    // Mapear al tipo TagInfo del frontend
    const tagInfos = [
      ...tags.map((t) => ({ name: t.name, count: t._count.images, type: 'tag' as const })),
      ...characters.map((c) => ({ name: c.name, count: c._count.images, type: 'character' as const })),
      ...ratings.map((r) => ({ name: r.name, count: r._count.images, type: 'rating' as const }))
    ];

    // Ordenar de forma descendente por count de imágenes asociadas
    tagInfos.sort((a, b) => b.count - a.count);

    res.json(tagInfos);
  } catch (error) {
    console.error('Error al obtener etiquetas:', error);
    res.status(500).json({ error: 'Error interno del servidor al consultar etiquetas.' });
  }
});

// Servidor escuchando peticiones
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`Imágenes servidas estáticamente en http://localhost:${PORT}/imagenes`);
});
