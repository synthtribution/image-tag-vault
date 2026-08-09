import { Controller, Get, Query } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImageListItemDto } from './dto/image-list-item.dto';

@Controller('api/images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get()
  async findByPage(@Query('page') page?: string): Promise<ImageListItemDto[]> {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const validPage = isNaN(pageNumber) || pageNumber < 1 ? 1 : pageNumber;
    return this.imagesService.findByPage(validPage);
  }
}
