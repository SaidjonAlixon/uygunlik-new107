import api from "../lib/api";
import { Video } from "../types/video";

// Client-side DTOs for type safety
export interface CreateVideoDto {
  title: string;
  description?: string;
  duration?: number;
}

export interface UpdateVideoDto {
  title?: string;
  description?: string;
  duration?: number;
}

class VideoService {
  async create(file: File | null, createVideoDto: CreateVideoDto & { filename?: string; url?: string }): Promise<Video> {
    // Agar file null bo'lsa, bu Google Drive havolasi
    if (!file && createVideoDto.url) {
      // Google Drive havolasi bilan video yaratish
      const response = await api.post("/videos", {
        title: createVideoDto.title,
        description: createVideoDto.description || '',
        filename: createVideoDto.filename || `gdrive_${Date.now()}`,
        url: createVideoDto.url,
      });
      return response.data;
    }

    // Real video upload
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    formData.append('title', createVideoDto.title);
    if (createVideoDto.description) {
      formData.append('description', createVideoDto.description);
    }
    if (createVideoDto.duration) {
      formData.append('duration', createVideoDto.duration.toString());
    }

    const response = await api.post("/upload/video", formData);
    return response.data;
  }

  async findAll(): Promise<Video[]> {
    const response = await api.get("/videos");
    return response.data;
  }

  async findOne(id: string): Promise<Video> {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  }

  async findByFilename(filename: string): Promise<Video> {
    try {
      const response = await api.get(`/videos/by-filename/${encodeURIComponent(filename)}`);
      return response.data;
    } catch (error: any) {
      // Agar filename bo'yicha topilmasa, barcha videolarni ko'rib qidirish
      if (error.response?.status === 404) {
        const allVideos = await this.findAll();
        const foundVideo = allVideos.find(v => 
          v.url && (
            v.url.includes(filename) || 
            filename.includes('preview') && v.url.includes('drive.google.com')
          )
        );
        if (foundVideo) {
          return foundVideo;
        }
      }
      throw error;
    }
  }

  async update(id: string, updateVideoDto: UpdateVideoDto): Promise<Video> {
    const response = await api.patch(`/videos/${id}`, updateVideoDto);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/videos/${id}`);
  }
}

export default new VideoService();
