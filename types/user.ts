import { Course } from "./course";

export enum Role {
  ADMIN = "admin",
  USER = "user",
}

export interface User {
  id: number;
  _id?: string; // Backward compatibility
  first_name: string;
  last_name: string;
  phone?: string;
  email: string;
  balance: number;
  courses: Course[];
  role: Role;
  status: boolean;
  tariff_id?: number;
  tariff?: {
    id: number;
    name: string;
    price: number;
  };
  createdAt: string;
  updatedAt: string;
}
