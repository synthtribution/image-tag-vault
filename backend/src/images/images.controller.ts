import { Controller, Get, Query, Param, BadRequestException } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImageListItemDto } from './dto/image-list-item.dto';
import { ImageResponseDto } from './dto/image-response.dto';

@Controller('api/images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get()
  async findByPage(
    @Query('page') page?: string,
    @Query('tags') tags?: string
  ): Promise<ImageListItemDto[]> {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const validPage = isNaN(pageNumber) || pageNumber < 1 ? 1 : pageNumber;
    return this.imagesService.findByPage(validPage, tags);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ImageResponseDto> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('ID de imagen inválido.');
    }
    return this.imagesService.findOne(numericId);
  }
}
