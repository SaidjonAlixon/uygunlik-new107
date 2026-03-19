import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseController } from './purchase.controller';
import { PurchaseService } from './purchase.service';
import { User } from '../user/user.schema';
import { Course } from '../course/course.schema';

@Module({
  imports: [TypeOrmModule.forFeature([User, Course])],
  controllers: [PurchaseController],
  providers: [PurchaseService],
})
export class PurchaseModule {}
