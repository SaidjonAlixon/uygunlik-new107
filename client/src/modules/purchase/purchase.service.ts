import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.schema';
import { Course } from '../course/course.schema';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
  ) {}

  async createPurchase(userId: number, courseId: number) {
    // Foydalanuvchini topish
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['courses'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Kursni topish
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Foydalanuvchi allaqachon bu kursni sotib olganmi tekshirish
    const hasCourse = user.courses.some(c => c.id === courseId);
    if (hasCourse) {
      throw new ConflictException('User already has this course');
    }

    // Foydalanuvchining balansini tekshirish
    if (user.balance < course.price) {
      throw new ConflictException('Insufficient balance');
    }

    // Balansdan pul ayirish
    user.balance -= course.price;
    
    // Kursni foydalanuvchiga qo'shish
    user.courses.push(course);
    
    // Saqlash
    await this.userRepository.save(user);

    return {
      message: 'Course purchased successfully',
      course: course,
      remainingBalance: user.balance,
    };
  }
}
