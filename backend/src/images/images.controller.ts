import { Controller, Get } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImageResponseDto } from './dto/image-response.dto';

@Controller('api/images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get()
  async findAll(): Promise<ImageResponseDto[]> {
    return this.imagesService.findAll();
  }
}
