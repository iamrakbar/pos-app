// src/stores/useAuth.ts
import { User } from '@/types/user';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AuthState = {
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  loginLocal: (token: string, user: User) => void;
  logout: () => void;
};

// Store reference to queryClient for cache invalidation
let queryClientRef: { clear: () => void } | null = null;

export function setQueryClientRef(client: { clear: () => void }) {
  queryClientRef = client;
}

// Web: sessionStorage (cleared on tab close, JS-readable but not persistent)
// Native: expo-secure-store (hardware-backed encrypted storage)
const platformStorage = {
  getItem: (name: string): string | null | Promise<string | null> =>
    Platform.OS === 'web'
      ? sessionStorage.getItem(name)
      : SecureStore.getItemAsync(name),
  setItem: (name: string, value: string): void | Promise<void> =>
    Platform.OS === 'web'
      ? sessionStorage.setItem(name, value)
      : SecureStore.setItemAsync(name, value),
  removeItem: (name: string): void | Promise<void> =>
    Platform.OS === 'web'
      ? sessionStorage.removeItem(name)
      : SecureStore.deleteItemAsync(name),
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      loginLocal: (token, user) => set({ token, user }),
      logout: () => {
        // Clear React Query cache to prevent stale data after logout
        queryClientRef?.clear();
        set({ token: null, user: null });
      },
    }),
    {
      name: 'soeat-order-auth',
      storage: createJSONStorage(() => platformStorage),
    }
  )
);
