import type { FlatListRef } from '../../helpers/internal/types';
import { YearPickerContextProvider } from './calendar-year-picker.context';
import type { YearPickerCellProps, YearPickerGridBodyProps, YearPickerGridProps, YearPickerTriggerHeadingProps, YearPickerTriggerIndicatorProps, YearPickerTriggerProps } from './calendar-year-picker.types';
declare const YearPickerTrigger: import("react").ForwardRefExoticComponent<YearPickerTriggerProps & import("react").RefAttributes<import("react-native").View>>;
declare const YearPickerTriggerHeading: import("react").ForwardRefExoticComponent<YearPickerTriggerHeadingProps & import("react").RefAttributes<import("react-native").Text>>;
declare const YearPickerTriggerIndicator: import("react").ForwardRefExoticComponent<YearPickerTriggerIndicatorProps & import("react").RefAttributes<import("react-native").View>>;
/**
 * Generic absolute-fill background container rendered behind the year grid
 * content. With no `children`, the active library theme decides the default
 * content: `glass` renders a `GlassView` blur layer; other themes render
 * nothing. Pass `children` to host arbitrary content (gradients, images)
 * with the container's positioning and clipping applied.
 */
declare const YearPickerGridBackground: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
    className?: string;
} & import("react").RefAttributes<import("react-native").View>>;
declare const YearPickerGrid: import("react").ForwardRefExoticComponent<YearPickerGridProps & import("react").RefAttributes<import("react-native").View>>;
declare const YearPickerGridBody: import("react").ForwardRefExoticComponent<YearPickerGridBodyProps & import("react").RefAttributes<FlatListRef>>;
declare const YearPickerCell: import("react").NamedExoticComponent<YearPickerCellProps & import("react").RefAttributes<import("react-native").View>>;
declare const CalendarYearPicker: {
    Trigger: import("react").ForwardRefExoticComponent<YearPickerTriggerProps & import("react").RefAttributes<import("react-native").View>>;
    TriggerHeading: import("react").ForwardRefExoticComponent<YearPickerTriggerHeadingProps & import("react").RefAttributes<import("react-native").Text>>;
    TriggerIndicator: import("react").ForwardRefExoticComponent<YearPickerTriggerIndicatorProps & import("react").RefAttributes<import("react-native").View>>;
    Grid: import("react").ForwardRefExoticComponent<YearPickerGridProps & import("react").RefAttributes<import("react-native").View>>;
    GridBackground: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
        className?: string;
    } & import("react").RefAttributes<import("react-native").View>>;
    GridBody: import("react").ForwardRefExoticComponent<YearPickerGridBodyProps & import("react").RefAttributes<FlatListRef>>;
    Cell: import("react").NamedExoticComponent<YearPickerCellProps & import("react").RefAttributes<import("react-native").View>>;
};
export { CalendarYearPicker, YearPickerCell, YearPickerContextProvider, YearPickerGrid, YearPickerGridBackground, YearPickerGridBody, YearPickerTrigger, YearPickerTriggerHeading, YearPickerTriggerIndicator, };
export default CalendarYearPicker;
//# sourceMappingURL=calendar-year-picker.d.ts.map