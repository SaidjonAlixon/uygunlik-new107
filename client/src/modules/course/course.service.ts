import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './course.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
  ) {}

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    const { videos, ...courseData } = createCourseDto;
    const course = this.courseRepository.create(courseData);
    return this.courseRepository.save(course);
  }

  async findAll(): Promise<Course[]> {
    return this.courseRepository.find({ relations: ['videos'] });
  }

  async findOne(id: number): Promise<Course> {
    return this.courseRepository.findOne({
      where: { id },
      relations: ['videos'],
    });
  }

  async update(id: number, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const { videos, ...updateData } = updateCourseDto;
    await this.courseRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.courseRepository.delete(id);
  }

  async addVideo(courseId: number, videoId: number): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['videos'],
    });
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Note: You'll need to implement video assignment logic here
    // This is a simplified version
    return this.courseRepository.save(course);
  }

  async removeVideo(courseId: number, videoId: number): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['videos'],
    });
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Note: You'll need to implement video removal logic here
    // This is a simplified version
    return this.courseRepository.save(course);
  }
}