import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Course } from '../course/course.schema';

export enum Role {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 0 })
  balance: number;

  @Column({ type: 'varchar', default: 'user' })
  role: string;

  @ManyToMany(() => Course, course => course.users)
  @JoinTable()
  courses: Course[];

  @Column({ default: true })
  status: boolean;

  // Next.js schema owns this column — must exist on entity so synchronize never drops it
  @Column({ type: 'int', nullable: true })
  tariff_id: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
