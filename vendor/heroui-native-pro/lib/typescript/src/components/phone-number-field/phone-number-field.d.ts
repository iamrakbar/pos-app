import type { InputGroupPrefixProps, InputGroupProps, InputGroupSuffixProps } from 'heroui-native/input-group';
import type { TextInput as TextInputType, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import type * as SelectPrimitivesTypes from '../../primitives/select/select.types';
import type { PhoneNumberFieldContentHandleProps, PhoneNumberFieldContentProps, PhoneNumberFieldCountry, PhoneNumberFieldPortalProps, PhoneNumberFieldRootProps, PhoneNumberFieldSelectProps } from './phone-number-field.types';
declare const PhoneNumberFieldRoot: import("react").ForwardRefExoticComponent<PhoneNumberFieldRootProps & import("react").RefAttributes<View>>;
/**
 * Country picker `Select` wired to the field state. Selection, open state,
 * presentation, and the disabled state are owned by the `PhoneNumberField`
 * root, so the corresponding `Select` props are not accepted here.
 */
declare const PhoneNumberFieldSelect: import("react").ForwardRefExoticComponent<PhoneNumberFieldSelectProps & import("react").RefAttributes<View>>;
/**
 * `Select.Portal` breaks ancestor context; re-wrap with `PhoneNumberFieldProvider`
 * so portaled `PhoneNumberField.Content` children still resolve `usePhoneNumberField()`.
 */
declare function PhoneNumberFieldPortal(props: PhoneNumberFieldPortalProps): import("react/jsx-runtime").JSX.Element;
declare namespace PhoneNumberFieldPortal {
    var displayName: string;
}
/**
 * Tinted backdrop behind the portaled picker surface.
 */
declare const PhoneNumberFieldOverlay: import("react").ForwardRefExoticComponent<import("heroui-native").SelectOverlayProps & import("react").RefAttributes<View>>;
/**
 * Picker surface. The presentation is fixed to `"dialog"`: the country list is
 * a long, searchable surface that does not fit a popover.
 *
 * Unlike a plain `Select` dialog, the surface is pinned below the top safe
 * area instead of being centered, and sized to half the space below it. The
 * search input takes focus as soon as the picker opens, so the lower part of
 * the screen belongs to the keyboard; anchoring the surface at the top and
 * capping its height keeps all of it visible without any keyboard-avoidance
 * machinery.
 *
 * Both are defaults: `style` / `styles.content` override the height and the
 * top offset, and `classNames.wrapper` can center the surface again.
 */
declare const PhoneNumberFieldContent: import("react").ForwardRefExoticComponent<PhoneNumberFieldContentProps & import("react").RefAttributes<View>>;
/**
 * Theme-aware background layer of the picker surface (re-exported from
 * `Select.ContentBackground`). Under the glass theme it renders the frosted
 * blur layer; pass a customized instance to the `background` prop of
 * `PhoneNumberField.Content`.
 */
declare const PhoneNumberFieldContentBackground: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
    className?: string;
} & import("react").RefAttributes<View>>;
/**
 * Decorative drag-handle bar signaling that the dialog can be swiped to
 * dismiss. Hidden from assistive technology — the affordance it advertises is
 * a gesture, not an action a screen reader user can take.
 */
declare const PhoneNumberFieldContentHandle: import("react").ForwardRefExoticComponent<PhoneNumberFieldContentHandleProps & import("react").RefAttributes<View>>;
/**
 * Country picker trigger rendered inside the prefix. Shows the selected flag
 * and dial code by default and dismisses the keyboard on press, so the phone
 * keyboard does not fight the picker dialog for screen space.
 */
declare const PhoneNumberFieldTrigger: import("react").ForwardRefExoticComponent<Omit<import("heroui-native").SelectTriggerProps, "variant"> & {
    classNames?: import("../../helpers/internal/types").ElementSlots<import("./phone-number-field.styles").PhoneNumberFieldTriggerSlots>;
    styles?: {
        base?: ViewStyle;
        flag?: import("react-native").TextStyle;
        dialCode?: import("react-native").TextStyle;
    };
} & import("react").RefAttributes<SelectPrimitivesTypes.TriggerRef>>;
/**
 * `SearchField` filtering the country list by name, ISO code, or dial code.
 * The query is owned by the field context and resets when the picker closes.
 *
 * The default input focuses on mount, which is also every time the picker
 * opens: the dialog portal unmounts its content on close.
 */
declare const PhoneNumberFieldSearchInput: import("react").ForwardRefExoticComponent<Omit<import("heroui-native").SearchFieldProps, "value" | "onChange"> & {
    onChange?: import("heroui-native").SearchFieldProps["onChange"];
    autoFocus?: boolean;
    inputProps?: import("heroui-native").SearchFieldInputProps;
} & import("react").RefAttributes<View>>;
/**
 * A single selectable country row — flag, dial code, name, and the selection
 * indicator by default.
 */
declare const PhoneNumberFieldCountryItem: import("react").ForwardRefExoticComponent<Omit<import("heroui-native").SelectItemProps, "value" | "children" | "label"> & {
    country: PhoneNumberFieldCountry;
    children?: import("react").ReactNode;
    classNames?: import("../../helpers/internal/types").ElementSlots<import("./phone-number-field.styles").PhoneNumberFieldCountryItemSlots>;
    styles?: {
        flag?: import("react-native").TextStyle;
        dialCode?: import("react-native").TextStyle;
        name?: import("react-native").TextStyle;
    };
} & import("react").RefAttributes<View>>;
/**
 * Virtualized country list. Defaults to the search-filtered countries from
 * context; `keyboardShouldPersistTaps="handled"` keeps row presses working in a
 * single tap while the search keyboard is open. Opens with the selected country
 * centred rather than at the top of a 240-entry list.
 */
declare const PhoneNumberFieldCountryList: import("react").ForwardRefExoticComponent<Omit<import("react-native").FlatListProps<PhoneNumberFieldCountry>, "data" | "renderItem"> & {
    countries?: PhoneNumberFieldCountry[];
    renderCountry?: (info: import("./phone-number-field.types").PhoneNumberFieldCountryRenderInfo) => import("react").ReactElement | null;
    emptyText?: string;
    className?: string;
    classNames?: import("../../helpers/internal/types").ElementSlots<import("./phone-number-field.styles").PhoneNumberFieldCountryListSlots>;
    styles?: {
        base?: ViewStyle;
        empty?: ViewStyle;
        emptyText?: import("react-native").TextStyle;
    };
} & import("react").RefAttributes<FlatList<PhoneNumberFieldCountry>>>;
/**
 * Layout container for the input row (country picker prefix + phone input).
 */
declare const PhoneNumberFieldInputGroupRoot: import("react").ForwardRefExoticComponent<InputGroupProps & import("react").RefAttributes<View>>;
/**
 * Leading slot of the input row hosting the country picker trigger.
 */
declare const PhoneNumberFieldPrefix: import("react").ForwardRefExoticComponent<InputGroupPrefixProps & import("react").RefAttributes<View>>;
/**
 * Trailing slot of the input row for custom decorators (validity icon, action
 * button, …).
 */
declare const PhoneNumberFieldSuffix: import("react").ForwardRefExoticComponent<InputGroupSuffixProps & import("react").RefAttributes<View>>;
/**
 * @note RTL: deliberately pinned left-to-right. Phone numbers read
 * left-to-right in every locale (matching the platform dialers), so the
 * default `textAlign` stays physical `"left"` instead of the base input's
 * `rtl:text-right`. The display value and mask placeholder are additionally
 * prefixed with an LRM under RTL layouts: they start with weak/neutral
 * characters (`"("`, digits), which an RTL paragraph would otherwise reorder.
 * `resolvePhoneNumberInputChange` strips bidi marks before comparing lengths,
 * so editing behavior is unaffected.
 */
declare const PhoneNumberFieldInput: import("react").ForwardRefExoticComponent<Omit<import("heroui-native").InputGroupInputProps, "value" | "onChangeText"> & {
    onChangeText?: import("heroui-native").InputGroupInputProps["onChangeText"];
} & import("react").RefAttributes<TextInputType>>;
/**
 * Static parts attached to the root. We assign properties explicitly instead of only using
 * `Object.assign`: some Metro / Hermes bundles do not reliably retain every key on `forwardRef`
 * results, which surfaced as `DateField.Input` being `undefined` at runtime.
 */
type PhoneNumberFieldStaticParts = {
    Select: typeof PhoneNumberFieldSelect;
    Portal: typeof PhoneNumberFieldPortal;
    Overlay: typeof PhoneNumberFieldOverlay;
    Content: typeof PhoneNumberFieldContent;
    ContentBackground: typeof PhoneNumberFieldContentBackground;
    ContentHandle: typeof PhoneNumberFieldContentHandle;
    Trigger: typeof PhoneNumberFieldTrigger;
    SearchInput: typeof PhoneNumberFieldSearchInput;
    CountryList: typeof PhoneNumberFieldCountryList;
    CountryItem: typeof PhoneNumberFieldCountryItem;
    InputGroup: typeof PhoneNumberFieldInputGroupRoot;
    Prefix: typeof PhoneNumberFieldPrefix;
    Input: typeof PhoneNumberFieldInput;
    Suffix: typeof PhoneNumberFieldSuffix;
};
declare const PhoneNumberField: typeof PhoneNumberFieldRoot & PhoneNumberFieldStaticParts;
/**
 * `PhoneNumberField` — international phone number field with per-country as-you-type
 * formatting, validation, E.164 output, smart paste, and a searchable country picker.
 *
 * @component PhoneNumberField - Root container. Owns the number / country / open state,
 * provides form-field context for `Label`, `Description`, and `FieldError`.
 * @component PhoneNumberField.InputGroup - Layout container for the input row.
 * @component PhoneNumberField.Prefix - Leading slot hosting the country picker trigger.
 * @component PhoneNumberField.Suffix - @optional Trailing slot for custom decorators.
 * @component PhoneNumberField.Input - Masked national number input (context-driven).
 * @component PhoneNumberField.Select - Country picker `Select` (dialog presentation).
 * @component PhoneNumberField.Trigger - Picker trigger showing flag + dial code by default.
 * @component PhoneNumberField.Portal - Portal re-providing the field context.
 * @component PhoneNumberField.Overlay - @optional Backdrop behind the picker surface.
 * @component PhoneNumberField.Content - Dialog picker surface.
 * @component PhoneNumberField.ContentBackground - @optional Theme-aware background layer
 * of the picker surface (re-exported from `Select.ContentBackground`).
 * @component PhoneNumberField.ContentHandle - @optional Drag-handle bar signaling the
 * dialog can be swiped to dismiss.
 * @component PhoneNumberField.SearchInput - @optional Search box filtering the country list.
 * @component PhoneNumberField.CountryList - Virtualized country list with default rows.
 * @component PhoneNumberField.CountryItem - @optional Single selectable country row.
 *
 * Props flow from `PhoneNumberField` to sub-components via context.
 *
 * @note RTL: mostly inherited. Row ordering (trigger, country rows), the dialog
 * surface, and the search input (`rtl:text-right` on its `TextInput`, icon
 * placement) come from the underlying heroui-native `Select`, `InputGroup`, and
 * `SearchField`; the component's own CSS uses logical or symmetric properties
 * only. The phone input itself is deliberately left-to-right (see
 * `PhoneNumberField.Input`), and dial codes rendered inside RTL text are
 * wrapped in Unicode LTR isolates so the leading plus sign keeps its place.
 */
export default PhoneNumberField;
//# sourceMappingURL=phone-number-field.d.ts.map