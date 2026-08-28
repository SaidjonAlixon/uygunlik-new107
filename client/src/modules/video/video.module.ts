import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Video } from './video.schema';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video]),
    MulterModule.register({
      dest: './uploads', // IMPORTANT: This is a temporary local storage. For production, use a cloud storage service like S3.
    }),
  ],
  controllers: [VideoController],
  providers: [VideoService],
})
export class VideoModule {}
