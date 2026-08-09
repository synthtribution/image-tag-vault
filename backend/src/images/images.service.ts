import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImageListItemDto } from './dto/image-list-item.dto';

@Injectable()
export class ImagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPage(page: number = 1): Promise<ImageListItemDto[]> {
    try {
      const pageSize = 100;
      const skip = (page - 1) * pageSize;

      console.log(`ImagesService.findByPage - Consultando página ${page} (skip: ${skip}, take: ${pageSize})...`);
      const images = await this.prisma.image.findMany({
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
}
