import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Video } from '../video/video.schema';
import { User } from '../user/user.schema';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  price: number;

  @Column('simple-array')
  category: string[];

  @OneToMany(() => Video, video => video.course)
  videos: Video[];

  @ManyToMany(() => User, user => user.courses)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
