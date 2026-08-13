import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TagResponseDto } from './dto/tag-response.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<TagResponseDto[]> {
    try {
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
      const tagResponse: TagResponseDto[] = [
        ...tags.map((t) => ({ name: t.name, count: t._count.images, type: 'tag' as const })),
        ...characters.map((c) => ({ name: c.name, count: c._count.images, type: 'character' as const })),
        ...ratings.map((r) => ({ name: r.name, count: r._count.images, type: 'rating' as const })),
      ];

      // 5. Ordenar descendentemente por contador de imágenes
      return tagResponse.sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error in TagsService.findAll:', error);
      throw new InternalServerErrorException('Error al consultar las etiquetas en la base de datos.');
    }
  }
}
