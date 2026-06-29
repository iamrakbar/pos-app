import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as Localization from 'expo-localization';
import { i18n } from '@/locales';

type Locale = 'id' | 'en';

// Default: detect from device; fallback to 'id'
function detectLocale(): Locale {
  const tag = Localization.getLocales()[0]?.languageTag ?? '';
  return tag.startsWith('en') ? 'en' : 'id';
}

interface UseLocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocale = create<UseLocaleState>()(
  persist(
    (set) => ({
      locale: detectLocale(),
      setLocale: (locale: Locale) => {
        i18n.locale = locale;
        set({ locale });
      },
    }),
    {
      name: 'soeat-locale',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          i18n.locale = state.locale;
        }
      },
    },
  ),
);
