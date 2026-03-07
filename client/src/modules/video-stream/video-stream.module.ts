import { Module } from '@nestjs/common';
import { VideoStreamController } from './video-stream.controller';
import { VideoStreamService } from './video-stream.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [VideoStreamController],
  providers: [VideoStreamService],
})
export class VideoStreamModule {}
