import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthResponse } from '../types';
import { authApi } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (res: AuthResponse) => void;
  logout: () => void;
  updateUser: (u: Partial<User>) => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: ({ token, user }) => {
        // KR-04: Hanya simpan ke Zustand — persist middleware handles localStorage
        set({ token, user });
      },

      logout: () => {
        // KR-04: Zustand persist akan otomatis clear 'cl-auth' key
        set({ token: null, user: null });
      },

      updateUser: (updates) =>
        set((s) => ({ user: s.user ? { ...s.user, ...updates } : null })),

      fetchMe: async () => {
        try {
          set({ isLoading: true });
          const user = await authApi.me();
          set({ user });
        } catch {
          get().logout();
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'cl-auth',
      partialize: (s) => ({ token: s.token, user: s.user }),
    }
  )
);
