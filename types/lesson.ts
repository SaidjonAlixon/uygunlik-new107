export interface Lesson {
  id: number;
  tariff_id: number;
  title: string;
  description?: string;
  video_url?: string;
  pdf_url?: string;
  test_url?: string;
  order_number: number;
  additional_resources?: any[];
  test_questions?: any[];
  createdAt?: string;
  updatedAt?: string;
}

