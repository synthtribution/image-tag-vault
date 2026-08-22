import { Controller, Get, Query } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagResponseDto } from './dto/tag-response.dto';

@Controller('api/tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async getSuggestions(
    @Query('search') search?: string,
    @Query('all') all?: string
  ): Promise<TagResponseDto[]> {
    const fetchAll = all === 'true';
    return this.tagsService.findSuggestions(search, fetchAll);
  }
}
