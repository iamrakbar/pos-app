import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as Localization from "expo-localization";
import {
  i18n,
  isLocale,
  translate,
  type Locale,
  type Translate,
  type TranslationParams,
} from "@/locales";
import { zustandStorage } from "@/lib/storage";

// Default: detect from device; fallback to 'id'
function detectLocale(): Locale {
  const languageCode = Localization.getLocales()[0]?.languageCode ?? "";
  return languageCode === "id" ? "id" : "en";
}

interface UseLocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const localeStorage = createJSONStorage(() => zustandStorage);

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
      name: "soeat-locale",
      storage: localeStorage,
      merge: (persistedState, currentState) => {
        const persistedLocale = (persistedState as Partial<UseLocaleState> | undefined)?.locale;
        return {
          ...currentState,
          locale: isLocale(persistedLocale) ? persistedLocale : currentState.locale,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          i18n.locale = state.locale;
        }
      },
    }
  )
);

export function useTranslation(): { locale: Locale; t: Translate } {
  const locale = useLocale((state) => state.locale);
  return {
    locale,
    t: (key, params?: TranslationParams) => translate(locale, key, params),
  };
}
