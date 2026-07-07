"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/user.store";
import userService from "@/services/user.service";

// This component will wrap our application and handle the user session.
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { setUser, user } = useUserStore();

  useEffect(() => {
    // We only want to fetch the user if the user state is initially undefined.
    // If it's null, it means we've already tried and failed (e.g., no token).
    // If it's an object, we already have the user.
    if (user !== undefined) {
      return;
    }

    // Check if token exists before making API call
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    if (!token) {
      setUser(null);
      return;
    }

    (async () => {
      try {
        const data = await userService.getMe();
        // On success, set the user data in the store.
        setUser(data.user);
      } catch (error: any) {
        // Silently handle 401 errors - just means user is not logged in
        if (error?.response?.status === 401 || error?.message?.includes('401')) {
          // Clear invalid token
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
          }
          setUser(null);
        } else {
        console.error("Failed to fetch user:", error);
        setUser(null);
        }
      }
    })();
  }, [user, setUser]); // Depend on user and setUser to avoid re-renders

  return <>{children}</>;
}
