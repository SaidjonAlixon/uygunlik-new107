import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { createReadStream, ReadStream } from 'fs';
import { join, resolve } from 'path';

@Injectable()
export class VideoStreamService {
  async getVideoStream(
    filename: string,
    range?: string,
  ): Promise<{
    fileStream: ReadStream;
    start: number;
    end: number;
    fileSize: number;
  }> {
    // Fayl nomini tekshirish
    if (!filename.match(/^[a-zA-Z0-9_\-\.]+$/)) {
      throw new BadRequestException('Invalid filename');
    }

    // Fayl yo'lini olish
    const videoPath = resolve(join('uploads', filename));

    // Fayl mavjudligini tekshirish
    try {
      await fs.access(videoPath);
    } catch {
      throw new NotFoundException(`File ${filename} not found`);
    }

    // Fayl stat
    const stats = await fs.stat(videoPath);
    const fileSize = stats.size;

    // Default interval
    let start = 0;
    let end = fileSize - 1;

    // Agar range berilgan bo'lsa
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      start = parseInt(parts[0], 10);
      end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Range validatsiya
      if (
        isNaN(start) ||
        isNaN(end) ||
        start < 0 ||
        end < 0 ||
        start > end ||
        start >= fileSize ||
        end >= fileSize
      ) {
        throw new BadRequestException('Invalid range');
      }
    }

    // Stream yaratish
    const fileStream = createReadStream(videoPath, { start, end });

    return { fileStream, start, end, fileSize };
  }
}
