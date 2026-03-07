import api from "../lib/api";
import { Lesson } from "../types/lesson";

export interface CreateLessonDto {
  title: string;
  description?: string;
  video_url?: string;
  pdf_url?: string;
  order_number?: number;
  additional_resources?: any[];
}

export interface UpdateLessonDto {
  title?: string;
  description?: string;
  video_url?: string;
  pdf_url?: string;
  order_number?: number;
  additional_resources?: any[];
}

class LessonService {
  async findAllByTariff(tariffId: string): Promise<Lesson[]> {
    const response = await api.get(`/tariffs/${tariffId}/lessons`);
    return response.data;
  }

  async findOne(id: string): Promise<Lesson> {
    const response = await api.get(`/lessons/${id}`);
    return response.data;
  }

  async create(tariffId: string, data: CreateLessonDto): Promise<Lesson> {
    const response = await api.post(`/tariffs/${tariffId}/lessons`, data);
    return response.data;
  }

  async update(id: string, data: UpdateLessonDto): Promise<Lesson> {
    const response = await api.patch(`/lessons/${id}`, data);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/lessons/${id}`);
  }
}

export default new LessonService();

