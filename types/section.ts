import { Lesson } from './lesson';

export interface LessonSection {
  id: number;
  tariff_id: number;
  name: string;
  description?: string;
  order_number: number;
  created_at?: string;
  updated_at?: string;
  lessons?: Lesson[];
}
