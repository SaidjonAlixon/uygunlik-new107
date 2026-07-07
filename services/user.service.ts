import api from "../lib/api";
import { User } from "../types/user";

// Define types for login and registration data for clarity
interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

class UserService {
  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const response = await api.post("/users/register", data);
    return response.data;
  }

  async login(data: LoginData): Promise<{ user: User; token: string }> {
    const response = await api.post("/users/login", data);
    return response.data;
  }

  async getMe(): Promise<{ user: User }> {
    const response = await api.get("/users/me");
    return response.data;
  }

  async updateProfile(data: Partial<User>) {
    const response = await api.patch("/users/me", data);
    return response.data;
  }

}

export default new UserService();