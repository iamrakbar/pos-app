import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { i18n, type Locale } from '@/locales';

// Default: detect from device; fallback to 'id'
function detectLocale(): Locale {
  const tag = Localization.getLocales()[0]?.languageTag ?? '';
  return tag.startsWith('id') ? 'id' : 'en';
}

interface UseLocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const localeStorage =
  Platform.OS === 'web'
    ? createJSONStorage(() => localStorage)
    : createJSONStorage(() => AsyncStorage);

const initialLocale = detectLocale();
i18n.locale = initialLocale;

export const useLocale = create<UseLocaleState>()(
  persist(
    (set) => ({
      locale: initialLocale,
      setLocale: (locale: Locale) => {
        i18n.locale = locale;
        set({ locale });
      },
    }),
    {
      name: 'soeat-locale',
      storage: localeStorage,
      onRehydrateStorage: () => (state) => {
        if (state) {
          i18n.locale = state.locale;
        }
      },
    },
  ),
);
