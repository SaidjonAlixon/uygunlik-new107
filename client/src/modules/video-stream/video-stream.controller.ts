import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  Headers,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { VideoStreamService } from './video-stream.service';
import { JwtAuthGuard } from '../user/guards/auth.guard';
import { extname } from 'path';

@Controller('video-stream')
export class VideoStreamController {
  constructor(private readonly videoStreamService: VideoStreamService) {}

  @Get('stream/:filename')
  @UseGuards(JwtAuthGuard)
  async getVideo(
    @Param('filename') filename: string,
    @Res() res: Response,
    @Headers('range') range: string,
    @Req() req: Request,
  ) {
    // Filename validatsiya
    if (!filename.match(/^[a-zA-Z0-9_\-\.]+$/)) {
      throw new BadRequestException('Invalid filename');
    }

    // Guard ishlamasa, qo'shimcha tekshiruv
    if (!req.user) {
      throw new UnauthorizedException('Invalid or missing token');
    }

    // Servisdan stream va hajmni olish
    const { fileStream, start, end, fileSize } =
      await this.videoStreamService.getVideoStream(filename, range);

    if (!fileStream) {
      throw new NotFoundException(`File ${filename} not found`);
    }

    // MIME type aniqlash
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.avi': 'video/x-msvideo',
    };
    const contentType =
      mimeTypes[extname(filename).toLowerCase()] || 'video/mp4';

    // Headerlar
    let statusCode = 200;
    const head: any = {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    };

    if (range) {
      const chunksize = end - start + 1;
      head['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;
      head['Content-Length'] = chunksize;
      statusCode = 206;
    } else {
      head['Content-Length'] = fileSize;
    }

    // Javob yozish
    res.writeHead(statusCode, head);

    // Streamni responsega ulash
    fileStream.pipe(res);

    // Error handling
    fileStream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).send('Stream error');
      } else {
        res.end();
      }
    });

    // Stream tugaganda response ham yopiladi
    fileStream.on('end', () => {
      res.end();
    });
  }
}
