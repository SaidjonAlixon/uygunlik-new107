export interface Video {
  id: number;
  _id?: string; // Backward compatibility
  title: string;
  description?: string;
  url: string;
  filename?: string; // Database'da mavjud
  duration?: number;
  createdAt: string;
  updatedAt: string;
}
