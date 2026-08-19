import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { AgendaAllDaySectionProps, AgendaBodyProps, AgendaCalendarGridProps, AgendaCalendarHeaderProps, AgendaCalendarProps, AgendaCurrentTimeIndicatorProps, AgendaDayColumnsProps, AgendaEventProps, AgendaEventTimeProps, AgendaEventTitleProps, AgendaHeaderProps, AgendaHeadingProps, AgendaMonthGridProps, AgendaNavButtonProps, AgendaRootProps, AgendaTimeGridProps, AgendaTodayButtonProps, AgendaViewSelectorProps, AgendaWeekHeaderProps } from './agenda.types';
import { useAgenda, useAgendaContext, useAgendaEvent, useAgendaPage } from './use-agenda';
/**
 * Compound Agenda component with sub-components.
 *
 * @component Agenda - Root container. Receives the state built by `useAgenda(options)`
 * as spread props (`<Agenda {...agenda}>`, web parity), wraps everything in a
 * `SplitView` with snap points derived from the measured top content, and renders
 * the default composition when children are omitted.
 *
 * @component Agenda.Background - Absolute-fill background container behind the
 * agenda shell. With no children, the active library theme decides the content
 * (glass theme renders a blur layer with a surface-secondary-matched fallback).
 * Accepts children to host custom content such as gradients with the container's
 * positioning and clipping applied. Replaceable via the `background` prop on Agenda.
 *
 * @component Agenda.Header - Top SplitView pane; measures its natural content height
 * so consumer content below the calendar expands the snap points dynamically.
 *
 * @component Agenda.Calendar - Month calendar bound to the agenda date, collapsing to
 * the selected week row at the minimum snap point. Children compose the calendar
 * anatomy (`Agenda.CalendarHeader`, `Agenda.CalendarGrid`, raw `Calendar.*` parts).
 *
 * @component Agenda.CalendarHeader - Measured wrapper around `Calendar.Header`;
 * children compose the header content (year picker trigger, nav, Today button).
 *
 * @component Agenda.CalendarGrid - Measured, collapse-animated month grid; children
 * customize day cells via `Calendar.GridBody`'s render API.
 *
 * @component Agenda.Heading - Localized month + year title for the active date.
 *
 * @component Agenda.TodayButton - Jumps to today and collapses the header.
 *
 * @component Agenda.NavButton - Previous / next agenda navigation for the current view.
 *
 * @component Agenda.DragArea - SplitView drag region between the header and the body.
 *
 * @component Agenda.DragHandle - Visual pill inside the drag area.
 *
 * @component Agenda.Body - Horizontally paged body kept in sync with the calendar.
 * Children act as the page template rendered per page (see `useAgendaPage`); parts
 * self-gate by view, so one template covers day, week, and month.
 *
 * @component Agenda.WeekHeader - Weekday letters (or names + date pills with
 * `showDates`) above the time grid on week pages.
 *
 * @component Agenda.AllDaySection - Packed all-day bars; children act as the
 * per-event template.
 *
 * @component Agenda.TimeGrid - Synced vertical hour grid with gutter labels, hour
 * lines, and drop guides; children compose the grid content.
 *
 * @component Agenda.DayColumns - One column per page day; children act as the
 * per-event template (default `Agenda.Event`).
 *
 * @component Agenda.Event - Positioned, draggable, resizable event card. Reads the
 * event from the template context; children customize the card content.
 *
 * @component Agenda.EventTitle - Title text of the template context event.
 *
 * @component Agenda.EventTime - Formatted time range of the template context event.
 *
 * @component Agenda.CurrentTimeIndicator - Live time badge + line on pages containing today.
 *
 * @component Agenda.MonthGrid - Month grid with spanning bars and per-cell chips;
 * children act as the per-event chip content template.
 *
 * @component Agenda.ViewSelector - Floating day / week / month selector built on
 * `Segment` (exposes `Group` / `Indicator` / `Item` / `Label` / `Separator`).
 *
 * State is built by `useAgenda(options)` and spread into the root. Inside the subtree,
 * `useAgendaContext()` exposes view, date, selection, event layout helpers, and
 * navigation actions; `useAgendaPage()` exposes the per-page date range; and
 * `useAgendaEvent()` exposes the current template event.
 */
declare const Agenda: import("react").ForwardRefExoticComponent<AgendaRootProps & import("react").RefAttributes<View>> & {
    /** @optional Theme-aware background container behind the agenda shell. */
    Background: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
        className?: string;
    } & import("react").RefAttributes<View>>;
    /** @optional Top SplitView pane with dynamic content measurement. */
    Header: import("react").ForwardRefExoticComponent<AgendaHeaderProps & import("react").RefAttributes<View>>;
    /** @optional Collapsible month calendar bound to the agenda date. */
    Calendar: import("react").ForwardRefExoticComponent<AgendaCalendarProps & import("react").RefAttributes<View>>;
    /** @optional Measured wrapper around `Calendar.Header`. */
    CalendarHeader: import("react").ForwardRefExoticComponent<AgendaCalendarHeaderProps & import("react").RefAttributes<View>>;
    /** @optional Measured, collapse-animated month grid. */
    CalendarGrid: import("react").ForwardRefExoticComponent<AgendaCalendarGridProps & import("react").RefAttributes<View>>;
    /** @optional Month + year title for the active date. */
    Heading: import("react").ForwardRefExoticComponent<AgendaHeadingProps & import("react").RefAttributes<import("react-native").Text>>;
    /** @optional Jump-to-today button. */
    TodayButton: {
        (props: AgendaTodayButtonProps): import("react/jsx-runtime").JSX.Element;
        displayName: "HeroUINative.Agenda.TodayButton";
    };
    /** @optional Previous / next agenda navigation. */
    NavButton: import("react").ForwardRefExoticComponent<AgendaNavButtonProps & import("react").RefAttributes<View>>;
    /** @optional SplitView drag region. */
    DragArea: import("react").ForwardRefExoticComponent<import("../split-view").SplitViewDragAreaProps & import("react").RefAttributes<View>>;
    /** @optional SplitView drag pill. */
    DragHandle: import("react").ForwardRefExoticComponent<import("../split-view").SplitViewDragHandleProps & import("react").RefAttributes<View>>;
    /** @optional Paged day / week / month body (children = page template). */
    Body: import("react").ForwardRefExoticComponent<AgendaBodyProps & import("react").RefAttributes<View>>;
    /** @optional Weekday row above the time grid on week pages. */
    WeekHeader: import("react").ForwardRefExoticComponent<AgendaWeekHeaderProps & import("react").RefAttributes<View>>;
    /** @optional Packed all-day bars (children = per-event template). */
    AllDaySection: import("react").ForwardRefExoticComponent<AgendaAllDaySectionProps & import("react").RefAttributes<View>>;
    /** @optional Synced vertical hour grid. */
    TimeGrid: import("react").ForwardRefExoticComponent<AgendaTimeGridProps & import("react").RefAttributes<View>>;
    /** @optional One column per page day (children = per-event template). */
    DayColumns: import("react").ForwardRefExoticComponent<AgendaDayColumnsProps & import("react").RefAttributes<View>>;
    /** @optional Positioned, draggable, resizable event card. */
    Event: import("react").ForwardRefExoticComponent<AgendaEventProps & import("react").RefAttributes<View>>;
    /** @optional Title of the template context event. */
    EventTitle: import("react").ForwardRefExoticComponent<AgendaEventTitleProps & import("react").RefAttributes<import("react-native").Text>>;
    /** @optional Time range of the template context event. */
    EventTime: import("react").ForwardRefExoticComponent<AgendaEventTimeProps & import("react").RefAttributes<import("react-native").Text>>;
    /** @optional Live time badge + line on pages containing today. */
    CurrentTimeIndicator: import("react").ForwardRefExoticComponent<AgendaCurrentTimeIndicatorProps & import("react").RefAttributes<View>>;
    /** @optional Month grid (children = per-event chip template). */
    MonthGrid: import("react").ForwardRefExoticComponent<AgendaMonthGridProps & import("react").RefAttributes<View>>;
    /** @optional Floating view mode selector built on `Segment`. */
    ViewSelector: import("react").ForwardRefExoticComponent<AgendaViewSelectorProps & import("react").RefAttributes<View>> & {
        Group: import("react").ForwardRefExoticComponent<import("heroui-native").TabsListProps & import("react").RefAttributes<View>>;
        Indicator: import("react").ForwardRefExoticComponent<import("heroui-native").TabsIndicatorProps & import("react").RefAttributes<View>>;
        Item: import("react").ForwardRefExoticComponent<import("heroui-native").TabsTriggerProps & import("react").RefAttributes<View>>;
        Label: import("react").ForwardRefExoticComponent<import("heroui-native").TabsLabelProps & import("react").RefAttributes<import("react-native").Text>>;
        Separator: import("react").ForwardRefExoticComponent<import("heroui-native").TabsSeparatorProps & import("react").RefAttributes<Animated.View>>;
    };
};
export { useAgenda, useAgendaContext, useAgendaEvent, useAgendaPage };
export default Agenda;
//# sourceMappingURL=agenda.d.ts.map