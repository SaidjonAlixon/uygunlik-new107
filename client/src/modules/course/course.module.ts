import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './course.schema';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course]),
  ],
  controllers: [CourseController],
  providers: [CourseService],
})
export class CourseModule {}
