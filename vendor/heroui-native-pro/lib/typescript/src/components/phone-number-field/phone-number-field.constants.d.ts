import type { PhoneNumberFieldCountry } from './phone-number-field.types';
export declare const DISPLAY_NAME: {
    ROOT: string;
    SELECT: string;
    PORTAL: string;
    OVERLAY: string;
    CONTENT: string;
    CONTENT_BACKGROUND: string;
    CONTENT_HANDLE: string;
    TRIGGER: string;
    SEARCH_INPUT: string;
    COUNTRY_LIST: string;
    COUNTRY_ITEM: string;
    INPUT_GROUP: string;
    INPUT: string;
    PREFIX: string;
    SUFFIX: string;
};
/**
 * Country used when neither `country` / `defaultCountry` nor the device locale
 * resolves to an entry of the country list.
 */
export declare const DEFAULT_COUNTRY_CODE = "US";
/**
 * Maximum number of digits in an E.164 number, dial code included.
 */
export declare const MAX_E164_DIGITS = 15;
/**
 * Hard cap for national number digits, applied when neither
 * `libphonenumber-js` metadata nor a country dial code narrows it down.
 */
export declare const MAX_NATIONAL_DIGITS = 15;
/**
 * Cap on the accessibility font scale for the field's own labels (flag, dial
 * code, country name). The input row and the country rows are single-line
 * layouts, so text is allowed to grow but not to the point of truncating the
 * country name or wrapping the trigger onto a second line.
 */
export declare const TEXT_MAX_FONT_SIZE_MULTIPLIER = 1.2;
/**
 * Fraction of the space below the top safe area taken by the picker surface.
 *
 * The surface starts at the top and its search input raises the keyboard on
 * open, so half of that space is what reliably stays visible: keyboards take
 * roughly 35-45% of the screen across compact and tall devices, and the
 * remainder covers the safe-area offset and the surface padding. A fixed
 * height (rather than a maximum) also keeps the list from resizing while the
 * search query narrows it down.
 *
 * Overridable per usage through `style` or `styles.content` on
 * `PhoneNumberField.Content`.
 */
export declare const CONTENT_HEIGHT_RATIO = 0.5;
/**
 * Virtualization defaults for the country list. The built-in dataset holds
 * ~240 rows, so the window is kept tight to keep the dialog's first paint
 * cheap; every value is overridable through `PhoneNumberField.CountryList`.
 */
export declare const COUNTRY_LIST_INITIAL_NUM_TO_RENDER = 12;
export declare const COUNTRY_LIST_MAX_TO_RENDER_PER_BATCH = 12;
export declare const COUNTRY_LIST_WINDOW_SIZE = 9;
/**
 * Where the selected country sits in the visible area when the picker opens, as
 * a fraction of that area: `0` pins it to the top, `0.5` centres it. Rows above
 * and below give the selection context to scroll from in both directions.
 */
export declare const COUNTRY_LIST_SELECTED_VIEW_POSITION = 0.5;
/**
 * Unicode LEFT-TO-RIGHT MARK. Prepended to the input display value under RTL
 * layouts so the weak/neutral characters of a formatted phone number
 * (`"(555) 123-4567"`) keep their left-to-right order.
 */
export declare const BIDI_LEFT_TO_RIGHT_MARK = "\u200E";
/**
 * Unicode LEFT-TO-RIGHT ISOLATE / POP DIRECTIONAL ISOLATE pair wrapping dial
 * codes rendered inside RTL text (see `isolateBidiLtr`).
 */
export declare const BIDI_LEFT_TO_RIGHT_ISOLATE = "\u2066";
export declare const BIDI_POP_DIRECTIONAL_ISOLATE = "\u2069";
/**
 * Built-in country dataset used by `PhoneNumberField` when no custom
 * `countries` prop is provided.
 */
export declare const COUNTRIES: PhoneNumberFieldCountry[];
/**
 * Resolves ambiguous dial codes shared by multiple countries to a primary
 * country when detecting the country from a typed or pasted number.
 */
export declare const PREFERRED_COUNTRY_FOR_DIAL_CODE_MAP: Record<string, string>;
/**
 * Per-country national number masks: `#` is a digit placeholder, any other
 * character is a literal inserted while typing. They format typed digits when
 * `libphonenumber-js` is not installed, and render the
 * `PhoneNumberField.Input` placeholder in every setup.
 *
 * Generated from `libphonenumber-js` metadata — each mask is the country's
 * example number run through the same formatting strategy the component uses
 * at runtime, with digits replaced by `#`. That shared origin is what keeps
 * the placeholder and the typed value grouped identically (Ukraine reads
 * `"00 000 0000"` and formats to `"50 123 4567"`, not two different shapes).
 * Regenerate with `node scripts/generate-phone-number-masks.js`.
 *
 * A mask describes the *common* national format, not the full numbering plan —
 * several countries (Germany, Indonesia, …) allow longer numbers than their
 * mask spells out. Digits past the mask are therefore appended unformatted and
 * the length cap comes from the E.164 budget instead (see
 * `getMaxNationalDigits`). Install `libphonenumber-js` for exact per-country
 * lengths and validation.
 */
export declare const FALLBACK_MASK_MAP: Record<string, string>;
//# sourceMappingURL=phone-number-field.constants.d.ts.map