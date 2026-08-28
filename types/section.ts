import { Lesson } from './lesson';

export interface LessonSection {
  id: number;
  /** Asosiy/egasi tarif (orqaga moslik) */
  tariff_id: number;
  /** Bo'lim chiqadigan barcha tariflar */
  tariff_ids?: number[];
  name: string;
  description?: string;
  order_number: number;
  created_at?: string;
  updated_at?: string;
  lessons?: Lesson[];
  /** Bo'lim yakuniy testi */
  test_questions?: any[];
}
