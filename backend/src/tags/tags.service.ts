import { Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TagResponseDto } from './dto/tag-response.dto';

@Injectable()
export class TagsService implements OnModuleInit {
  private tagsCache: TagResponseDto[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadCache();
  }

  // Carga todas las etiquetas, personajes y clasificaciones en memoria RAM
  async loadCache() {
    try {
      console.log('TagsService - Cargando caché de autocompletado en memoria...');
      
      // 1. Obtener todas las etiquetas generales con el recuento de imágenes
      const tags = await this.prisma.tag.findMany({
        select: {
          name: true,
          _count: {
            select: { images: true },
          },
        },
      });

      // 2. Obtener todos los personajes con el recuento de imágenes
      const characters = await this.prisma.character.findMany({
        select: {
          name: true,
          _count: {
            select: { images: true },
          },
        },
      });

      // 3. Obtener todas las clasificaciones con el recuento de imágenes
      const ratings = await this.prisma.rating.findMany({
        select: {
          name: true,
          _count: {
            select: { images: true },
          },
        },
      });

      // 4. Consolidar todo en el formato TagResponseDto
      this.tagsCache = [
        ...tags.map((t) => ({ name: t.name, count: t._count.images, type: 'tag' as const })),
        ...characters.map((c) => ({ name: c.name, count: c._count.images, type: 'character' as const })),
        ...ratings.map((r) => ({ name: r.name, count: r._count.images, type: 'rating' as const })),
      ];

      // 5. Ordenar descendentemente por popularidad (count)
      this.tagsCache.sort((a, b) => b.count - a.count);
      console.log(`TagsService - Caché cargada con éxito: ${this.tagsCache.length} sugerencias cargadas en memoria.`);
    } catch (error) {
      console.error('Error al precargar la caché de etiquetas:', error);
    }
  }

  // Busca sugerencias en memoria de forma ultra-rápida y limita a 15 elementos (o devuelve todo si all es true)
  async findSuggestions(search?: string, all?: boolean, type?: string): Promise<TagResponseDto[]> {
    let list = this.tagsCache;

    // Si se especifica el tipo, filtramos el arreglo en memoria
    if (type) {
      list = list.filter((item) => item.type === type);
    }

    if (all) {
      return list;
    }

    if (!search) {
      // Si no hay parámetro de búsqueda y no se solicita todo, devolvemos las 15 más populares
      return list.slice(0, 15);
    }

    const query = search.toLowerCase();
    const matched: TagResponseDto[] = [];

    // Búsqueda lineal eficiente sobre la caché pre-ordenada y filtrada
    for (const item of list) {
      if (item.name.toLowerCase().includes(query)) {
        matched.push(item);
        if (matched.length === 15) {
          break; // Salimos de inmediato si ya completamos las 15 sugerencias
        }
      }
    }

    return matched;
  }
}
