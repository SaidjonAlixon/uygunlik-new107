import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Course } from '../course/course.schema';

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  url: string;

  @Column({ nullable: true, default: 'video/mp4' })
  type: string;

  @Column({ default: 0 })
  duration: number; // in seconds

  @ManyToOne(() => Course, course => course.videos, { nullable: true })
  course: Course;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
