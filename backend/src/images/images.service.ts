import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImageResponseDto } from './dto/image-response.dto';

@Injectable()
export class ImagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ImageResponseDto[]> {
    try {
      const images = await this.prisma.image.findMany({
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
        orderBy: {
          createdAt: 'desc',
        },
      });

      return images.map((img) => ({
        image: img.filename,
        created_at: img.createdAt.toISOString(),
        tags: img.tags.map((t) => t.tag.name),
        character_tags: img.characters.map((c) => c.character.name),
        ratings: img.rating ? [img.rating.name] : [],
      }));
    } catch (error) {
      console.error('Error in ImagesService.findAll:', error);
      throw new InternalServerErrorException('Error al consultar las imágenes en la base de datos.');
    }
  }
}
