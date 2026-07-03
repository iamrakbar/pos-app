// src/stores/useAuth.ts
import { User } from '@/types/user';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  merchantId: string | null;
  activeMerchant: App.Data.Merchant.Auth.MerchantSummaryData | null;
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  login: (payload: App.Data.Merchant.Auth.AuthTokenData) => void;
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
      refreshToken: null,
      user: null,
      merchantId: null,
      activeMerchant: null,
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      login: (payload) => {
        const activeMerchant = payload.merchants[0] ?? null;
        // refresh_token isn't in the generated AuthTokenData type yet, but the
        // login response does include it — capture it if present (unused for
        // now: POST /refresh authenticates via the access token, not this).
        const refreshToken = (payload as { refresh_token?: string }).refresh_token ?? null;
        set({
          token: payload.access_token,
          refreshToken,
          user: payload.user,
          activeMerchant,
          merchantId: activeMerchant?.id ?? null,
        });
      },
      logout: () => {
        // Clear React Query cache to prevent stale data after logout
        queryClientRef?.clear();
        set({ token: null, refreshToken: null, user: null, merchantId: null, activeMerchant: null });
      },
    }),
    {
      name: 'soeat-order-auth',
      storage: createJSONStorage(() => platformStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        merchantId: state.merchantId,
        activeMerchant: state.activeMerchant,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
