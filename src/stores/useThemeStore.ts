import { zustandStorage } from '@/lib/storage';
import { Uniwind } from 'uniwind';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ThemeState = {
    isDarkMode: boolean;
    setDarkMode: (isDarkMode: boolean) => void;
};

const themeStorage = createJSONStorage(() => zustandStorage);

function applyTheme(isDarkMode: boolean) {
    Uniwind.setTheme(isDarkMode ? 'dark' : 'light');
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            isDarkMode: false,
            setDarkMode: (isDarkMode) => {
                applyTheme(isDarkMode);
                set({ isDarkMode });
            },
        }),
        {
            name: 'soeat-theme-settings',
            storage: themeStorage,
            onRehydrateStorage: () => (state) => {
                if (state) {
                    applyTheme(state.isDarkMode);
                }
            },
        }
    )
);
