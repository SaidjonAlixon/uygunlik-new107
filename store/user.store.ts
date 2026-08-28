import { User } from "@/types/user";
import { create } from "zustand";
import UserService from "@/services/user.service";

interface UserStore {
  user: User | null | undefined;
  loading: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  initializeUser: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  user: undefined,
  loading: true,
  setUser: (user: User | null) => set({ user, loading: false }),
  clearUser: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    set({ user: null });
  },
  initializeUser: async () => {
    // Check if token exists before making API call
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    if (!token) {
      set({ user: null, loading: false });
      return;
    }
    
    set({ loading: true });
    try {
      const data = await UserService.getMe();
      set({ user: data.user, loading: false });
    } catch (error: any) {
      console.error("Failed to initialize user:", error);
      // Clear user and token on any error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      set({ user: null, loading: false });
    }
  },
}));
