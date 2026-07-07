import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EskizService } from './eskiz.service';
import { Eskiz } from './eskiz.schema';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Eskiz]),
  ],
  providers: [EskizService],
  exports: [EskizService],
})
export class EskizModule {}
