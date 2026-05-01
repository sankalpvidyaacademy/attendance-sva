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
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

const STORAGE_KEY = "sankalp-auth";

function loadFromStorage(): { user: AuthUser | null; view: ViewType } {
  if (typeof window === "undefined") return { user: null, view: "login" };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.user && parsed.view) {
        return { user: parsed.user, view: parsed.view };
      }
    }
  } catch {
    // Invalid data, ignore
  }
  return { user: null, view: "login" };
}

function saveToStorage(user: AuthUser | null, view: ViewType) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, view }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage full or unavailable, ignore
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  view: "login",
  _hasHydrated: false,
  setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
  login: (user: AuthUser) => {
    const view = user.role === "ADMIN" ? "admin" : user.role === "TEACHER" ? "teacher" : "student";
    saveToStorage(user, view);
    set({ user, view });
  },
  logout: () => {
    saveToStorage(null, "login");
    set({ user: null, view: "login" });
  },
  setUser: (user: AuthUser) => {
    saveToStorage(user, get().view);
    set({ user });
  },
}));

// Hydrate the store from localStorage on the client side
// Must be called in a useEffect in the root component
export function hydrateAuthStore() {
  const { user, view } = loadFromStorage();
  if (user) {
    useAuthStore.setState({ user, view, _hasHydrated: true });
  } else {
    useAuthStore.setState({ _hasHydrated: true });
  }
}

// Hook to check if the store has been hydrated (for avoiding SSR mismatches)
export function useHasHydrated() {
  return useAuthStore((state) => state._hasHydrated);
}
