import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ImagesModule } from './images/images.module';
import { TagsModule } from './tags/tags.module';

@Module({
  imports: [PrismaModule, ImagesModule, TagsModule],
})
export class AppModule {}
