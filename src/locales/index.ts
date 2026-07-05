import { en } from './en';
import { id } from './id';

export type Locale = 'en' | 'id';

const translations = {
    en,
    id,
};

type TranslationValue = string | { [key: string]: TranslationValue };

export const i18n = {
    locale: 'en' as Locale,
    t(key: string): string {
        const localeMap = translations[this.locale] ?? translations.en;
        const value = key.split('.').reduce<TranslationValue | undefined>((current, part) => {
            if (current && typeof current === 'object') {
                return current[part];
            }
            return undefined;
        }, localeMap);

        if (typeof value === 'string') return value;
        return key;
    },
};

export function t(key: string): string {
    return i18n.t(key);
}
