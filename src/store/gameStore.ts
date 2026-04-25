import { create } from 'zustand';

interface GameState {
  hearts: number;
  sessionXp: number;
  setHearts: (h: number) => void;
  loseHeart: () => void;
  addXp: (xp: number) => void;
  resetSession: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  hearts: 5,
  sessionXp: 0,

  setHearts: (h) => set({ hearts: Math.max(0, Math.min(5, h)) }),

  loseHeart: () =>
    set((s) => ({ hearts: Math.max(0, s.hearts - 1) })),

  addXp: (xp) => set((s) => ({ sessionXp: s.sessionXp + xp })),

  resetSession: () => set({ sessionXp: 0 }),
}));
