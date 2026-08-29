import type { PhoneNumberFieldCountry, PhoneNumberFieldValueDetails } from './phone-number-field.types';
/**
 * Strips bidirectional control marks (LRM, RLM, ALM, embedding/override/isolate
 * marks) that RTL keyboards insert around phone numbers and that
 * `PhoneNumberField.Input` prepends to its display value under RTL layouts.
 */
export declare function stripBidiControlMarks(text: string): string;
/**
 * Strips bidi control marks, then removes every non-digit character.
 */
export declare function sanitizePhoneNumberDigits(text: string): string;
/**
 * Wraps a weak-direction fragment (a dial code like `"+44"`) in a Unicode
 * left-to-right isolate. Inside an RTL paragraph the leading plus sign is a
 * neutral character and would otherwise be reordered to the end (`"44+"`);
 * the isolate pins the fragment left-to-right without affecting the
 * surrounding text.
 */
export declare function isolateBidiLtr(text: string): string;
/**
 * Fills a `#`-template mask with digits, revealing each literal at the moment
 * the official as-you-type formatting would: a bracket appears once the group
 * it wraps is complete (`"20"` → `"20"`, `"201"` → `"(201)"`), a separator once
 * the following group receives its first digit (`"(201) 5"`, never `"(201) "`).
 * Digits left over once the mask is exhausted are appended unformatted — masks
 * describe the common national format, not the full numbering plan, so a
 * longer-than-usual number must still be typeable.
 *
 * @param digits - National number digits.
 * @param mask - Template where `#` is a digit placeholder (e.g. `"(###) ###-####"`).
 */
export declare function applyPhoneNumberMask(digits: string, mask: string): string;
/**
 * Counts the digit placeholders (`#`) in a mask template.
 */
export declare function countMaskDigits(mask: string): number;
/**
 * Formats national number digits for display, following the country mask — the
 * same template the placeholder shows — so the value a user types always lands
 * in the shape the field promised.
 *
 * As-you-type grouping from `libphonenumber-js` is deliberately not used while
 * the number fits the mask. Its rules are chosen per prefix and per length, so
 * they rearrange digits already on screen mid-word: an Albanian number reads
 * `"77 777"`, then `"777 777"`, then `"77 777 7777"`, and a Botswanan one walks
 * through four layouts before landing on the placeholder's. Prefixes no rule
 * covers fare worse — Belize renders `"0-000-000"` against a `"000-0000"`
 * placeholder. One template per country trades per-prefix grouping (a Berlin
 * landline reads `"3090 1820"`, the grouping `libphonenumber-js` own as-you-type
 * formatter gives it, rather than `"30 901820"`) for a layout that never moves
 * under the caret. Grouping is presentation only: `nationalNumber`, `e164` and
 * validity come from the digits and are unaffected.
 *
 * Numbers that outgrow the mask keep it and take the extra digits onto the last
 * group, rather than switching to the grouping the metadata gives their length.
 * A mask describes a country's common format, and several plans reach further:
 * Belize adds an eleven-digit toll-free range on top of its seven-digit
 * numbers, Germany's numbers run from four digits to fifteen. Handing those
 * lengths to the metadata regroups the digits already typed — a German number
 * would turn `"3012 3456789"` into `"30 1234567890"` on the twelfth keystroke,
 * and a Belize toll-free number `"080-0123"` into `"0-800-1234"` on the eighth.
 * The layout the field opened with therefore holds for the whole number.
 *
 * Countries without a known mask are grouped by metadata, and left as bare
 * digits when the package is absent.
 *
 * @param digits - National number digits.
 * @param country - Selected country.
 */
export declare function formatNationalNumber(digits: string, country: PhoneNumberFieldCountry): string;
/**
 * Maximum national number digits the country's dial code leaves within the
 * E.164 budget (15 digits including the dial code) — e.g. 13 for Germany
 * (`"+49"`). This is the outermost limit: it applies on its own when
 * `libphonenumber-js` is not installed, and bounds the metadata-driven checks
 * otherwise.
 */
export declare function getMaxNationalDigits(country: PhoneNumberFieldCountry): number;
/**
 * Trims trailing digits the country's numbering plan cannot accept, so a value
 * that arrives faster than the input's `maxLength` can react — a paste, a
 * controlled `value`, keystrokes typed ahead of a render — never settles into a
 * number longer than the plan describes.
 *
 * Uses `getIsNationalNumberAtMaxLength` per digit when `libphonenumber-js` is
 * installed, and the E.164 digit budget otherwise.
 */
export declare function trimDigitsToCountryLimit(digits: string, country: PhoneNumberFieldCountry): string;
/**
 * Whether the country's numbering plan leaves room for another digit after the
 * ones already entered.
 *
 * A country's possible lengths span all of its prefixes, so length alone is too
 * permissive: Ukraine allows ten national digits, but only for numbers starting
 * with 8 or 9, and a `"50…"` number that accepted a tenth digit grew past
 * anything the plan describes. The question is therefore whether the number can
 * still be *formatted* one digit longer — formatting rules are chosen by prefix
 * and have a fixed capacity, so losing the rule means the plan has run out of
 * room for this prefix. Countries whose numbers genuinely vary in length keep
 * growing, because a longer rule takes over.
 *
 * Digits that match no rule at all (a run of zeros, say) are capped at the
 * country mask instead, which is the length the placeholder advertises. Without
 * `libphonenumber-js` only the E.164 budget is known.
 *
 * @param digits - Current national number digits.
 * @param country - Selected country.
 */
export declare function getIsNationalNumberAtMaxLength(digits: string, country: PhoneNumberFieldCountry): boolean;
/**
 * Whether the digits form a plausible complete number for the country.
 * With `libphonenumber-js` this is a metadata length check; the fallback
 * treats the country mask's digit count as a minimum plausible length,
 * because several masks are shorter than the real numbering plan.
 */
export declare function getIsCompletePhoneNumber(digits: string, country: PhoneNumberFieldCountry): boolean;
/**
 * Whether the digits form a valid number for the country.
 * With `libphonenumber-js` this validates against real numbering plans; the
 * fallback is a completeness (length) check only.
 */
export declare function getIsValidPhoneNumber(digits: string, country: PhoneNumberFieldCountry): boolean;
/**
 * Builds the E.164 representation (`"+15551234567"`).
 * Prefers `libphonenumber-js` parsing (handles national prefixes); falls back
 * to concatenating the country dial code with the digits.
 *
 * @returns An empty string when no digits are entered.
 */
export declare function buildE164PhoneNumber(digits: string, country: PhoneNumberFieldCountry): string;
/**
 * Derives an example placeholder from the country's fallback mask
 * (`"(###) ###-####"` → `"(000) 000-0000"`).
 *
 * @returns An empty string when no mask is known for the country.
 */
export declare function getPhoneNumberPlaceholder(country: PhoneNumberFieldCountry): string;
/**
 * Finds a country by ISO 3166-1 alpha-2 code (case-insensitive).
 */
export declare function findCountryByCode(countries: PhoneNumberFieldCountry[], code: string | undefined): PhoneNumberFieldCountry | undefined;
/**
 * Finds the country matching a dial code (e.g. `"+44"`), resolving codes
 * shared by multiple countries through `PREFERRED_COUNTRY_FOR_DIAL_CODE_MAP`.
 */
export declare function findCountryByDialCode(countries: PhoneNumberFieldCountry[], dialCode: string): PhoneNumberFieldCountry | undefined;
/**
 * Result of parsing an international (`+`-prefixed) input.
 */
export interface InternationalPhoneNumberMatch {
    /**
     * The detected country.
     */
    country: PhoneNumberFieldCountry;
    /**
     * The national number digits remaining after the dial code.
     */
    nationalNumber: string;
}
/**
 * Detects the country and national number from text containing a `+` (smart
 * paste / dial code typing). Uses `libphonenumber-js` region detection when
 * installed; the fallback performs a longest-dial-code prefix match.
 *
 * @returns `undefined` when no country in the list matches.
 */
export declare function parseInternationalPhoneNumberInput(countries: PhoneNumberFieldCountry[], text: string): InternationalPhoneNumberMatch | undefined;
/**
 * Extracts an ISO 3166-1 alpha-2 region code from the device locale
 * (e.g. `"en-US"` → `"US"`).
 */
export declare function getDeviceRegionCode(): string | undefined;
/**
 * Resolves the initial country code: explicit `defaultCountry` prop, device
 * locale region, `DEFAULT_COUNTRY_CODE`, then the first list entry.
 */
export declare function resolveInitialCountryCode(countries: PhoneNumberFieldCountry[], preferredCode: string | undefined): string;
/**
 * Filters countries by a search query matched against the country name,
 * ISO code, and dial code (with or without the leading plus sign).
 */
export declare function filterCountriesByQuery(countries: PhoneNumberFieldCountry[], query: string): PhoneNumberFieldCountry[];
/**
 * Options for `resolvePhoneNumberInputChange`.
 */
export interface ResolvePhoneNumberInputChangeOptions {
    /**
     * Raw text emitted by the `TextInput`.
     */
    text: string;
    /**
     * National number digits before this change.
     */
    previousDigits: string;
    /**
     * Formatted value displayed before this change (deletion detection).
     */
    previousFormatted: string;
    /**
     * Currently selected country.
     */
    country: PhoneNumberFieldCountry;
    /**
     * Available country list (smart paste country detection).
     */
    countries: PhoneNumberFieldCountry[];
}
/**
 * Result of `resolvePhoneNumberInputChange`.
 */
export interface ResolvedPhoneNumberInputChange {
    /**
     * Next national number digits (sanitized and length-capped).
     */
    digits: string;
    /**
     * Next country — differs from the input country after a smart paste.
     */
    country: PhoneNumberFieldCountry;
    /**
     * Raw text to keep displayed while an international prefix is being typed
     * and has not resolved to a country yet (`"+"`, `"+4"`). Empty in every
     * other case, including once the prefix resolves.
     */
    internationalDraft: string;
}
/**
 * Computes the next input state from a raw text change:
 *
 * 1. **Smart paste** — text containing `+` switches the country (when detectable)
 *    and keeps the national remainder.
 * 2. **Typed dial code** — a leading `+` that is still too short to identify a
 *    country is echoed back as a draft, so the plus is not silently dropped
 *    into the current country's national number.
 * 3. **Deletion through literals** — when a backspace removed only a mask literal
 *    (digit count unchanged, text shorter), the last digit is dropped instead so
 *    the user can delete through `") "`-style separators.
 * 4. **Length capping** — digits beyond the country's maximum are trimmed.
 */
export declare function resolvePhoneNumberInputChange(options: ResolvePhoneNumberInputChangeOptions): ResolvedPhoneNumberInputChange;
/**
 * Builds the `onValueChange` payload for the current digits and country.
 */
export declare function buildPhoneNumberValueDetails(digits: string, country: PhoneNumberFieldCountry): PhoneNumberFieldValueDetails;
//# sourceMappingURL=phone-number-field.utils.d.ts.map