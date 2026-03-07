export interface Lesson {
  id: number;
  tariff_id: number;
  title: string;
  description?: string;
  video_url?: string;
  pdf_url?: string;
  order_number: number;
  additional_resources?: any[];
  createdAt?: string;
  updatedAt?: string;
}

