import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "PASSENGER" | "DRIVER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setSession: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: (accessToken, refreshToken, user) => {
        document.cookie = `role=${user.role}; path=/; max-age=604800`;
        set({ accessToken, refreshToken, user });
      },
      clearSession: () => {
        document.cookie = "role=; path=/; max-age=0";
        set({ accessToken: null, refreshToken: null, user: null });
      },
    }),
    { name: "piki-dada-auth" },
  ),
);
