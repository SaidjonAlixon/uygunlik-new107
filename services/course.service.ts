import api from "../lib/api";
import { Course } from "../types/course";

// Client-side DTOs for type safety
export interface CreateCourseDto {
  title: string;
  description?: string;
  price: number;
  category: string[];
  videos?: string[];
}

export interface UpdateCourseDto {
  title?: string;
  description?: string;
  price?: number;
  category?: string[];
  videos?: string[];
}

class CourseService {
  async create(data: CreateCourseDto): Promise<Course> {
    const response = await api.post("/courses", data);
    return response.data;
  }

  async findAll(): Promise<Course[]> {
    const response = await api.get("/courses");
    return response.data;
  }

  async findOne(id: string): Promise<Course> {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  }

  async update(id: string, data: UpdateCourseDto): Promise<Course> {
    const response = await api.patch(`/courses/${id}`, data);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/courses/${id}`);
  }

  async addVideo(courseId: string, videoId: string): Promise<Course> {
    const response = await api.post(`/courses/${courseId}/videos/${videoId}`);
    return response.data;
  }

  async removeVideo(courseId: string, videoId: string): Promise<Course> {
    const response = await api.delete(`/courses/${courseId}/videos/${videoId}`);
    return response.data;
  }
}

export default new CourseService();
