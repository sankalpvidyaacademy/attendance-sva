import { create } from "zustand";

export type ViewType =
  | "login"
  | "admin"
  | "teacher"
  | "student";

export interface AuthUser {
  id: string;
  userId: string;
  name: string;
  role: string;
  class?: string | null;
  subjects?: string[] | null;
  chatId?: string | null;
  phone?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  view: ViewType;
  login: (user: AuthUser) => void;
  logout: () => void;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  view: "login",
  login: (user: AuthUser) => {
    const view = user.role === "ADMIN" ? "admin" : user.role === "TEACHER" ? "teacher" : "student";
    set({ user, view });
  },
  logout: () => set({ user: null, view: "login" }),
  setUser: (user: AuthUser) => set({ user }),
}));
