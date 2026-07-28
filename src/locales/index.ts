import { en } from "./en";
import { id } from "./id";

export type Locale = "en" | "id";

const translations = { en, id };
type TranslationValue = string | { readonly [key: string]: TranslationValue };
type TranslationParams = Record<string, string | number>;

export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "id"];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && SUPPORTED_LOCALES.includes(value as Locale);
}

export function getLocaleTag(locale: Locale): "en-US" | "id-ID" {
  return locale === "id" ? "id-ID" : "en-US";
}

function resolveTranslation(map: TranslationValue, key: string): TranslationValue | undefined {
  return key.split(".").reduce<TranslationValue | undefined>((current, part) => {
    if (current && typeof current === "object") return current[part];
    return undefined;
  }, map);
}

export function translate(locale: Locale, key: string, params?: TranslationParams): string {
  const translated = resolveTranslation(translations[locale] ?? translations.en, key);
  const fallback = resolveTranslation(translations.en, key);
  const value = typeof translated === "string" ? translated : fallback;

  if (typeof value !== "string") return key;
  if (!params) return value;

  return Object.entries(params).reduce(
    (result, [name, replacement]) => result.replaceAll(`{{${name}}}`, String(replacement)),
    value
  );
}

export const i18n = {
  locale: "en" as Locale,
  t(key: string, params?: TranslationParams): string {
    return translate(this.locale, key, params);
  },
};

export function t(key: string, params?: TranslationParams): string {
  return i18n.t(key, params);
}
