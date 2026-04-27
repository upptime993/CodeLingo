import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameState {
  hearts: number;
  sessionXp: number;
  setHearts: (h: number) => void;
  loseHeart: () => void;
  addXp: (xp: number) => void;
  resetSession: () => void;
}

// GAP-03: Tambahkan persist middleware agar hearts tidak direset saat refresh browser di tengah kuis
export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      hearts: 5,
      sessionXp: 0,

      setHearts: (h) => set({ hearts: Math.max(0, Math.min(5, h)) }),

      loseHeart: () =>
        set((s) => ({ hearts: Math.max(0, s.hearts - 1) })),

      addXp: (xp) => set((s) => ({ sessionXp: s.sessionXp + xp })),

      resetSession: () => set({ sessionXp: 0 }),
    }),
    {
      name: 'cl-game',
      // Hanya persist hearts, bukan sessionXp (session XP boleh reset tiap kali buka)
      partialize: (s) => ({ hearts: s.hearts }),
    }
  )
);
