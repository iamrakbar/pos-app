import { en, type TranslationSchema } from "./en";
import { id } from "./id";

export type Locale = "en" | "id";

const translations = { en, id };
type TranslationValue = string | { readonly [key: string]: TranslationValue };
export type TranslationParams = Record<string, string | number>;

type LeafKey<T> = {
  [Key in keyof T & string]: T[Key] extends string
    ? Key
    : T[Key] extends Record<string, unknown>
      ? `${Key}.${LeafKey<T[Key]>}`
      : never;
}[keyof T & string];

export type TranslationKey = LeafKey<TranslationSchema>;
export type Translate = (key: TranslationKey, params?: TranslationParams) => string;

export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "id"];
const warnedMissingKeys = new Set<string>();

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

export function translate(locale: Locale, key: TranslationKey, params?: TranslationParams): string {
  const translated = resolveTranslation(translations[locale] ?? translations.en, key);
  const fallback = resolveTranslation(translations.en, key);
  const value = typeof translated === "string" ? translated : fallback;

  if (typeof value !== "string") {
    if (__DEV__ && !warnedMissingKeys.has(key)) {
      warnedMissingKeys.add(key);
      console.warn(`[localization] Missing translation for "${key}" in locale "${locale}".`);
    }
    return key;
  }
  if (!params) return value;

  return Object.entries(params).reduce(
    (result, [name, replacement]) => result.replaceAll(`{{${name}}}`, String(replacement)),
    value
  );
}

export const i18n = {
  locale: "en" as Locale,
  t(key: TranslationKey, params?: TranslationParams): string {
    return translate(this.locale, key, params);
  },
};

export function t(key: TranslationKey, params?: TranslationParams): string {
  return i18n.t(key, params);
}
