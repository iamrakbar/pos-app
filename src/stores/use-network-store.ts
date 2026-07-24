import { create } from 'zustand';

type NetworkState = {
    isOffline: boolean;
    lastOfflineAt: number | null;
    setOffline: () => void;
    setOnline: () => void;
};

export const useNetworkStore = create<NetworkState>((set) => ({
    isOffline: false,
    lastOfflineAt: null,
    setOffline: () => set({ isOffline: true, lastOfflineAt: Date.now() }),
    setOnline: () => set({ isOffline: false }),
}));
