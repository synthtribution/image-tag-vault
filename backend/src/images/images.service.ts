import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImageListItemDto } from './dto/image-list-item.dto';
import { ImageResponseDto } from './dto/image-response.dto';

@Injectable()
export class ImagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPage(page: number = 1, tagsParam?: string): Promise<ImageListItemDto[]> {
    try {
      const pageSize = 100;
      const skip = (page - 1) * pageSize;

      // Construir la condición where para búsquedas relacionales
      let where: any = {};

      if (tagsParam) {
        const tagsList = tagsParam
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

        if (tagsList.length > 0) {
          where = {
            AND: tagsList.map((term) => ({
              OR: [
                {
                  tags: {
                    some: {
                      tag: {
                        name: term,
                      },
                    },
                  },
                },
                {
                  characters: {
                    some: {
                      character: {
                        name: term,
                      },
                    },
                  },
                },
                {
                  rating: {
                    name: term,
                  },
                },
              ],
            })),
          };
        }
      }

      console.log(`ImagesService.findByPage - Consultando página ${page} (tags: ${tagsParam || 'ninguno'}, skip: ${skip}, take: ${pageSize})...`);
      const images = await this.prisma.image.findMany({
        where,
        select: {
          id: true,
          filename: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      });

      return images.map((img) => ({
        id: img.id,
        image: img.filename,
      }));
    } catch (error) {
      console.error('Error in ImagesService.findByPage:', error);
      throw new InternalServerErrorException('Error al consultar las imágenes en la base de datos.');
    }
  }

  async findOne(id: number): Promise<ImageResponseDto> {
    try {
      console.log(`ImagesService.findOne - Buscando detalles de la imagen ID: ${id}`);
      const img = await this.prisma.image.findUnique({
        where: { id },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          characters: {
            include: {
              character: true,
            },
          },
          rating: true,
        },
      });

      if (!img) {
        throw new NotFoundException(`Imagen con ID ${id} no encontrada.`);
      }

      return {
        image: img.filename,
        created_at: img.createdAt.toISOString(),
        tags: img.tags.map((t) => t.tag.name),
        character_tags: img.characters.map((c) => c.character.name),
        ratings: img.rating ? [img.rating.name] : [],
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error in ImagesService.findOne for id ${id}:`, error);
      throw new InternalServerErrorException('Error al consultar los detalles de la imagen.');
    }
  }

  // Método para obtener una selección aleatoria de imágenes sobre toda la base de datos (con o sin filtros)
  async findRandom(count: number, tagsParam?: string): Promise<ImageListItemDto[]> {
    try {
      // Construir la condición where para búsquedas relacionales
      let where: any = {};

      if (tagsParam) {
        const tagsList = tagsParam
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

        if (tagsList.length > 0) {
          where = {
            AND: tagsList.map((term) => ({
              OR: [
                {
                  tags: {
                    some: {
                      tag: {
                        name: term,
                      },
                    },
                  },
                },
                {
                  characters: {
                    some: {
                      character: {
                        name: term,
                      },
                    },
                  },
                },
                {
                  rating: {
                    name: term,
                  },
                },
              ],
            })),
          };
        }
      }

      // 1. Obtener únicamente los IDs de todas las imágenes que coinciden (operación indexada muy rápida)
      console.log(`ImagesService.findRandom - Buscando IDs coincidentes (tags: ${tagsParam || 'ninguno'})...`);
      const allIds = await this.prisma.image.findMany({
        where,
        select: {
          id: true,
        },
      });

      if (allIds.length === 0) {
        return [];
      }

      // 2. Mezclar los IDs usando Fisher-Yates parcial de forma imparcial (Complejidad O(K))
      const shuffledIds: number[] = [];
      const idsPool = allIds.map((item) => item.id);
      const limit = Math.min(count, idsPool.length);

      for (let i = 0; i < limit; i++) {
        // Elegir un índice aleatorio del pool restante (entre i y idsPool.length - 1)
        const randomIndex = Math.floor(Math.random() * (idsPool.length - i)) + i;
        // Intercambiar el elemento actual con el elemento aleatorio
        [idsPool[i], idsPool[randomIndex]] = [idsPool[randomIndex], idsPool[i]];
        shuffledIds.push(idsPool[i]);
      }

      // 3. Consultar únicamente el id y filename de las imágenes seleccionadas
      console.log(`ImagesService.findRandom - Solicitando datos para ${shuffledIds.length} imágenes...`);
      const images = await this.prisma.image.findMany({
        where: {
          id: {
            in: shuffledIds,
          },
        },
        select: {
          id: true,
          filename: true,
        },
      });

      // 4. Mapear al formato ImageListItemDto
      return images.map((img) => ({
        id: img.id,
        image: img.filename,
      }));
    } catch (error) {
      console.error('Error in ImagesService.findRandom:', error);
      throw new InternalServerErrorException('Error al consultar imágenes aleatorias en la base de datos.');
    }
  }
}
