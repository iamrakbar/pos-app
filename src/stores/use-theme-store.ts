import { zustandStorage } from '@/lib/storage';
import { Uniwind } from 'uniwind';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeState = {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
};

type LegacyThemeState = Partial<ThemeState> & {
    isDarkMode?: boolean;
};

const themeStorage = createJSONStorage(() => zustandStorage);

function applyTheme(mode: ThemeMode) {
    Uniwind.setTheme(mode);
}

applyTheme('system');

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            mode: 'system',
            setMode: (mode) => {
                applyTheme(mode);
                set({ mode });
            },
        }),
        {
            name: 'soeat-theme-settings',
            storage: themeStorage,
            version: 1,
            migrate: (persistedState) => {
                const state = persistedState as LegacyThemeState | undefined;

                if (state?.mode === 'system' || state?.mode === 'light' || state?.mode === 'dark') {
                    return { mode: state.mode };
                }

                if (typeof state?.isDarkMode === 'boolean') {
                    return { mode: state.isDarkMode ? 'dark' : 'system' };
                }

                return { mode: 'system' };
            },
            partialize: (state) => ({ mode: state.mode }),
            onRehydrateStorage: () => (state) => {
                applyTheme(state?.mode ?? 'system');
            },
        }
    )
);
