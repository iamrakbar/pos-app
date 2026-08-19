import type { AgendaView } from './agenda.types';
/**
 * Display name constants for the compound Agenda (`HeroUINative.Agenda.*`).
 */
export declare const DISPLAY_NAME: {
    readonly ROOT: "HeroUINative.Agenda.Root";
    readonly BACKGROUND: "HeroUINative.Agenda.Background";
    readonly HEADER: "HeroUINative.Agenda.Header";
    readonly CALENDAR: "HeroUINative.Agenda.Calendar";
    readonly CALENDAR_HEADER: "HeroUINative.Agenda.CalendarHeader";
    readonly CALENDAR_GRID: "HeroUINative.Agenda.CalendarGrid";
    readonly HEADING: "HeroUINative.Agenda.Heading";
    readonly TODAY_BUTTON: "HeroUINative.Agenda.TodayButton";
    readonly NAV_BUTTON: "HeroUINative.Agenda.NavButton";
    readonly DRAG_AREA: "HeroUINative.Agenda.DragArea";
    readonly DRAG_HANDLE: "HeroUINative.Agenda.DragHandle";
    readonly BODY: "HeroUINative.Agenda.Body";
    readonly WEEK_HEADER: "HeroUINative.Agenda.WeekHeader";
    readonly ALL_DAY_SECTION: "HeroUINative.Agenda.AllDaySection";
    readonly TIME_GRID: "HeroUINative.Agenda.TimeGrid";
    readonly DAY_COLUMNS: "HeroUINative.Agenda.DayColumns";
    readonly EVENT: "HeroUINative.Agenda.Event";
    readonly EVENT_TITLE: "HeroUINative.Agenda.EventTitle";
    readonly EVENT_TIME: "HeroUINative.Agenda.EventTime";
    readonly CURRENT_TIME_INDICATOR: "HeroUINative.Agenda.CurrentTimeIndicator";
    readonly MONTH_GRID: "HeroUINative.Agenda.MonthGrid";
    readonly VIEW_SELECTOR: "HeroUINative.Agenda.ViewSelector";
};
/**
 * Pages rendered on each side of the frozen anchor date (per view mode).
 * The pager therefore covers `anchor ± PAGE_WINDOW` days / weeks / months.
 */
export declare const PAGE_WINDOW = 60;
/**
 * Total page count of the horizontal pager.
 */
export declare const PAGE_COUNT: number;
/**
 * Stable index array backing the pager `FlatList` data.
 */
export declare const PAGE_INDICES: number[];
/**
 * Drag / resize snapping granularity in minutes.
 */
export declare const SNAP_MINUTES = 5;
/**
 * Minimum event duration in minutes enforced during resize.
 */
export declare const MIN_EVENT_MINUTES = 5;
/**
 * Default rendered height of one time slot in px.
 */
export declare const DEFAULT_SLOT_HEIGHT = 60;
/**
 * Default minutes represented by one grid slot.
 */
export declare const DEFAULT_SLOT_DURATION = 60;
/**
 * Default first rendered hour (inclusive).
 */
export declare const DEFAULT_START_HOUR = 0;
/**
 * Default last rendered hour (exclusive).
 */
export declare const DEFAULT_END_HOUR = 24;
/**
 * Width in px of the hour label gutter on the left of the time grid.
 */
export declare const TIME_GUTTER_WIDTH = 56;
/**
 * Update interval of the current-time indicator in ms.
 */
export declare const NOW_INDICATOR_INTERVAL_MS = 60000;
/**
 * Rendered height in px of one packed all-day row.
 */
export declare const ALL_DAY_ROW_HEIGHT = 26;
/**
 * Top offset in px of the all-day section when it is the first element of a page
 * (day pages, where no week header carries the page's top padding).
 */
export declare const ALL_DAY_STANDALONE_TOP_PADDING = 8;
/**
 * Rendered height in px of one month event chip (including its gap).
 */
export declare const MONTH_EVENT_HEIGHT = 18;
/**
 * Default maximum event chips per month cell before the "+N" overflow label.
 */
export declare const DEFAULT_MAX_MONTH_EVENTS = 2;
/**
 * Vertical offset in px from the top of a month row to the first event chip
 * (space reserved for the date pill).
 */
export declare const MONTH_DATE_OFFSET = 28;
/**
 * Extra px added below the collapsed week row so it is not clipped flush.
 */
export declare const COLLAPSED_BOTTOM_PADDING = 4;
/**
 * Delay in ms before a pressed event starts dragging (distinguishes tap from drag).
 */
export declare const EVENT_PRE_DRAG_DELAY = 220;
/**
 * Height in px of the invisible resize hit area at the bottom of an event.
 */
export declare const RESIZE_HANDLE_HIT_HEIGHT = 12;
/**
 * Extra touch area around the resize handle (extends past the chip's bottom edge),
 * so the grabber is easy to catch without hitting the exact pixel row.
 */
export declare const RESIZE_GESTURE_HIT_SLOP: {
    readonly top: 8;
    readonly bottom: 16;
    readonly left: 16;
    readonly right: 16;
};
/**
 * Horizontal pager virtualization settings (small window keeps at most a few pages alive).
 */
export declare const PAGER_WINDOW_SIZE = 3;
export declare const PAGER_MAX_TO_RENDER_PER_BATCH = 1;
export declare const PAGER_INITIAL_NUM_TO_RENDER = 1;
/**
 * Minimum visibility percentage before a swiped page commits a date change.
 */
export declare const PAGE_VIEWABILITY_THRESHOLD = 90;
/**
 * Estimated collapsed top-section height in px used before measurements settle
 * (calendar header + weekday row + one week row).
 */
export declare const ESTIMATED_COLLAPSED_TOP_HEIGHT = 142;
/**
 * Estimated expanded top-section height in px used before measurements settle.
 */
export declare const ESTIMATED_EXPANDED_TOP_HEIGHT = 380;
/**
 * Default order of the `Agenda.ViewSelector` options.
 */
export declare const DEFAULT_VIEW_OPTIONS: AgendaView[];
/**
 * Default labels of the `Agenda.ViewSelector` options.
 */
export declare const DEFAULT_VIEW_LABELS: Record<AgendaView, string>;
/**
 * Opacity of the tint overlay derived from `event.color`.
 */
export declare const EVENT_COLOR_TINT_OPACITY = 0.16;
/**
 * Minimum card height in px before the default event content shows the time label.
 */
export declare const EVENT_TIME_MIN_HEIGHT = 34;
/**
 * Default chevron icon size of `Agenda.NavButton`.
 */
export declare const NAV_ICON_SIZE = 18;
/**
 * Minutes scrolled above "now" when the time grid mounts (one hour of context).
 */
export declare const INITIAL_SCROLL_LEAD_MINUTES = 60;
/**
 * Bottom padding of the scrollable time grid so the last events are not covered
 * by the floating `Agenda.ViewSelector`.
 */
export declare const BODY_SCROLL_BOTTOM_PADDING = 88;
/**
 * Timing duration in ms of one snapped drop-guide position step while dragging or
 * resizing an event (applied at the shared-value write sites, not on gesture start).
 */
export declare const DRAG_GUIDE_STEP_DURATION_MS = 80;
/**
 * Delay in ms before a freshly mounted page brings in its event chips layer.
 * Sized to outlast the view selector's indicator animation, so on view changes the
 * empty grid shows immediately and the data arrives after the indicator settles.
 */
export declare const EVENTS_LAYER_REVEAL_DELAY_MS = 200;
//# sourceMappingURL=agenda.constants.d.ts.map