import { Lesson } from "./lesson";

export interface Tariff {
  id: number;
  name: string;
  description?: string;
  price: number;
  lessons_count?: number;
  lessons?: Lesson[];
  createdAt?: string;
  updatedAt?: string;
}

