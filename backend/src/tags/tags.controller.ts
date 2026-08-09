import { Controller, Get } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagResponseDto } from './dto/tag-response.dto';

@Controller('api/tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async findAll(): Promise<TagResponseDto[]> {
    return this.tagsService.findAll();
  }
}
