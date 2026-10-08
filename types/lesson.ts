export interface Lesson {
  id: number;
  tariff_id: number;
  section_id?: number;
  section_name?: string;
  section_order?: number;
  title: string;
  description?: string;
  video_url?: string;
  pdf_url?: string;
  test_url?: string;
  /** Dars bo‘yicha fikr: majburiy bo‘lsa, fikr qoldirilmaguncha test ochilmaydi */
  feedback_mode?: 'optional' | 'required';
  order_number: number;
  additional_resources?: any[];
  test_questions?: any[];
  /** Shu dars testi yana qaysi darslarda ko'rinsin */
  test_visible_lesson_ids?: number[];
  createdAt?: string;
  updatedAt?: string;
}

