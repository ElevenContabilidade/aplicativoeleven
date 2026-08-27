"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SessionKind = "equipe" | "cliente";

interface AuthState {
  isAuthenticated: boolean;
  kind: SessionKind | null;
  userId: string | null;
  email: string | null;
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  login: (kind: SessionKind, email: string, userId?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      kind: null,
      userId: null,
      email: null,
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      login: (kind, email, userId) => set({ isAuthenticated: true, kind, email, userId: userId ?? null }),
      logout: () => set({ isAuthenticated: false, kind: null, userId: null, email: null }),
    }),
    {
      name: "eleven-hub-auth",
      version: 1,
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated, kind: state.kind, userId: state.userId, email: state.email }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
