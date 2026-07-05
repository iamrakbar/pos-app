import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Uniwind } from 'uniwind';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ThemeState = {
    isDarkMode: boolean;
    setDarkMode: (isDarkMode: boolean) => void;
};

const themeStorage =
    Platform.OS === 'web'
        ? createJSONStorage(() => localStorage)
        : createJSONStorage(() => AsyncStorage);

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
