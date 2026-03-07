import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from './video.schema';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { promises as fs } from 'fs';
import { extname, join, resolve } from 'path';
import { randomBytes } from 'crypto';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
  ) {}

  async create(
    file: Express.Multer.File,
    createVideoDto: CreateVideoDto,
  ): Promise<Video> {
    // Fayl validatsiyasi
    const allowedMimes = ['video/mp4', 'video/webm', 'video/avi'];
    if (!file || !allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid video format');
    }

    const allowedExtensions = ['.mp4', '.webm', '.avi'];
    const extension = extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      throw new BadRequestException('Invalid file extension');
    }

    // Upload papkasini yaratish
    const uploadPath = resolve('uploads');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
    } catch (error) {
      throw new BadRequestException(
        `Failed to create upload directory: ${error.message}`,
      );
    }

    // Noyob fayl nomi yaratish
    const uniqueSuffix = randomBytes(16).toString('hex');
    const newFilename = `${uniqueSuffix}${extension}`;
    const newPath = join(uploadPath, newFilename);

    // Faylni ko'chirish
    try {
      await fs.rename(file.path, newPath);
    } catch (error) {
      throw new BadRequestException(
        `Failed to save video file: ${error.message}`,
      );
    }

    // DTO'dan faqat kerakli maydonlarni olish
    const videoData = {
      title: createVideoDto.title,
      description: createVideoDto.description,
      url: newFilename, // Faqat fayl nomi saqlanadi
      type: file.mimetype,
    };

    // Ma'lumotlar bazasiga saqlash
    try {
      const video = this.videoRepository.create(videoData);
      return await this.videoRepository.save(video);
    } catch (error) {
      // Agar saqlash muvaffaqiyatsiz bo'lsa, faylni o'chirish
      try {
        await fs.unlink(newPath);
      } catch (unlinkError) {
        console.error(`Failed to clean up file: ${unlinkError.message}`);
      }
      throw new BadRequestException(
        `Failed to save video to database: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<Video[]> {
    try {
      return await this.videoRepository.find();
    } catch (error) {
      throw new BadRequestException(`Failed to fetch videos: ${error.message}`);
    }
  }

  async findOne(id: number): Promise<Video> {
    try {
      const video = await this.videoRepository.findOne({ where: { id } });
      if (!video) {
        throw new NotFoundException(`Video with ID ${id} not found`);
      }
      return video;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch video: ${error.message}`);
    }
  }

  async findByFilename(filename: string): Promise<Video> {
    // Fayl nomini validatsiya qilish
    if (!filename.match(/^[a-zA-Z0-9_\-\.]+$/)) {
      throw new BadRequestException('Invalid filename');
    }

    try {
      const video = await this.videoRepository.findOne({ where: { url: filename } });
      if (!video) {
        throw new NotFoundException(
          `Video with filename ${filename} not found`,
        );
      }
      return video;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch video: ${error.message}`);
    }
  }

  async findByCourse(courseId: number): Promise<Video[]> {
    try {
      return await this.videoRepository.find({
        where: { course: { id: courseId } },
        relations: ['course'],
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch videos: ${error.message}`);
    }
  }

  async update(id: number, updateVideoDto: UpdateVideoDto): Promise<Video> {
    // DTO'dan faqat kerakli maydonlarni olish
    const updateData = {
      title: updateVideoDto.title,
      description: updateVideoDto.description,
    };

    try {
      await this.videoRepository.update(id, updateData);
      const updatedVideo = await this.videoRepository.findOne({ where: { id } });
      if (!updatedVideo) {
        throw new NotFoundException(`Video with ID ${id} not found`);
      }
      return updatedVideo;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update video: ${error.message}`);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const video = await this.videoRepository.findOne({ where: { id } });
      if (!video) {
        throw new NotFoundException(`Video with ID ${id} not found`);
      }

      // Faylni o'chirish
      const uploadPath = resolve('uploads');
      const filePath = join(uploadPath, video.url);
      try {
        await fs.access(filePath); // Fayl mavjudligini tekshirish
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Failed to delete file ${filePath}: ${error.message}`);
        // Fayl topilmasa, jarayonni davom ettirish mumkin
      }

      // Ma'lumotlar bazasidan o'chirish
      await this.videoRepository.delete(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete video: ${error.message}`);
    }
  }

  async updateProgress(videoId: number, userId: number, progressData: { progress: number; completed: boolean }) {
    // Bu method video progress ni saqlash uchun ishlatiladi
    // Hozircha oddiy response qaytaramiz, keyinchalik progress table qo'shish mumkin
    return {
      videoId,
      userId,
      progress: progressData.progress,
      completed: progressData.completed,
      updatedAt: new Date(),
    };
  }
}