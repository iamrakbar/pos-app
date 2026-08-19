import type { CalendarDate, CalendarDateTime, DateFormatter as DateFormatterType } from '@internationalized/date';
import type { AgendaAllDayLayoutItem, AgendaEvent, AgendaEventLayout, AgendaFirstDayOfWeek, AgendaMonthRowLayout, AgendaView } from './agenda.types';
/**
 * Clamps a number into `[min, max]`. Worklet-safe.
 */
export declare function clampNumber(value: number, min: number, max: number): number;
/**
 * Instant reset for the DnD drop translation: the event re-renders at its new time
 * from data, so the drop translation must not spring back visibly.
 */
export declare function instantDropAnimation(toValue: number): number;
/**
 * Localized hour labels for the time gutter. The first hour is omitted so the label
 * does not collide with the grid's top edge.
 */
export declare function buildHourLabels(startHour: number, endHour: number, formatter: DateFormatterType): {
    hour: number;
    label: string;
}[];
/**
 * Formats minutes-of-day (e.g. `870` -> `"14:30"`) with the given time formatter.
 */
export declare function formatMinutesOfDay(formatter: DateFormatterType, totalMinutes: number): string;
/**
 * Converts a `CalendarDateTime` into a monotonic comparable minute value.
 * Multipliers are padded (32 days / 13 months) so the ordering never inverts
 * across month or year boundaries.
 */
export declare function toComparableMinutes(dateTime: CalendarDateTime): number;
/**
 * Minutes elapsed since local midnight of the event's own day.
 */
export declare function getMinutesFromMidnight(dateTime: CalendarDateTime): number;
/**
 * Event duration in wall-clock minutes (clamped to a non-negative value).
 *
 * Computed as whole calendar days between the start and end dates plus the
 * minute-of-day difference. {@link toComparableMinutes} must NOT be used here:
 * its padded multipliers are ordering-only and inflate differences that cross
 * month or year boundaries.
 */
export declare function getEventDurationMinutes(event: AgendaEvent): number;
/**
 * Days visible for a date in the given view: `[date]` for day, a full week for week,
 * empty for month (month uses {@link getVisibleWeeks}).
 */
export declare function getVisibleDays(view: AgendaView, date: CalendarDate, locale: string, firstDayOfWeek: AgendaFirstDayOfWeek | undefined): CalendarDate[];
/**
 * Six week rows (7 days each) covering the month of the given date.
 */
export declare function getVisibleWeeks(date: CalendarDate, locale: string, firstDayOfWeek: AgendaFirstDayOfWeek | undefined): CalendarDate[][];
/**
 * Builds the overlap column layout map for all timed events: connected overlap
 * clusters are packed greedily into columns (first column whose last event ends
 * at or before the candidate's start).
 */
export declare function buildEventLayoutMap(events: AgendaEvent[]): Map<string, AgendaEventLayout>;
/**
 * Converts an event's calendar day into a `CalendarDate` (drops the time part).
 */
export declare function toDateOnly(dateTime: CalendarDateTime): CalendarDate;
/**
 * Last calendar day actually covered by an event, honoring the half-open
 * `[start, end)` convention used by {@link getEventDurationMinutes} and the
 * timed-event overlap packing: an event ending exactly at midnight of a later
 * day occupies zero minutes of that day, so the day before is the last covered
 * one. Events ending mid-day, single-day events, and zero-duration events keep
 * their end date unchanged.
 */
export declare function getLastCoveredDay(event: AgendaEvent): CalendarDate;
/**
 * Packs all-day events covering the given visible day range into rows.
 * Returns `colStart` / `colSpan` / `row` per event, clamped to the range.
 */
export declare function getAllDayLayoutForDays(allDayEvents: AgendaEvent[], visibleDays: CalendarDate[]): AgendaAllDayLayoutItem[];
/**
 * Spanning-event layout for one month week row: all-day events covering two or
 * more days of the week are packed into rows above the per-cell chips.
 */
export declare function getMonthRowLayout(events: AgendaEvent[], week: CalendarDate[]): AgendaMonthRowLayout;
/**
 * Events shown inside a month cell: everything covering the day except the week's
 * spanning events (which render as bars above the cells).
 */
export declare function getPerCellEvents(events: AgendaEvent[], day: CalendarDate, spanningIds: ReadonlySet<string>): AgendaEvent[];
/**
 * Builds the set of day keys (ISO date strings) covered by at least one event,
 * including every day of multi-day spans. Used for calendar day indicators.
 * Spans are capped at 370 days per event as a runaway guard.
 */
export declare function buildEventDayKeySet(events: AgendaEvent[]): Set<string>;
/**
 * Pager index of the given date relative to the frozen anchor for the view mode.
 * Day pages step by one day, week pages by seven days, month pages by one calendar month.
 */
export declare function getPageIndexForDate(view: AgendaView, anchor: CalendarDate, date: CalendarDate, locale: string, firstDayOfWeek: AgendaFirstDayOfWeek | undefined): number;
/**
 * Date represented by a pager index (start-of-page date for week/month).
 */
export declare function getDateForPageIndex(view: AgendaView, anchor: CalendarDate, index: number, locale: string, firstDayOfWeek: AgendaFirstDayOfWeek | undefined): CalendarDate;
/**
 * Advances a date by a number of pages while preserving the day-of-week (week view)
 * or day-of-month (month view, clamped by the date library).
 */
export declare function addPagesToDate(view: AgendaView, date: CalendarDate, pages: number): CalendarDate;
/**
 * Snaps a drag translation in px to whole minutes on the grid.
 */
export declare function snapDeltaMinutes(translationPx: number, pxPerMinute: number, snapMinutes: number): number;
/**
 * Zero-based index of the week row containing `date` within the month grid of the
 * visible month starting at `monthStart`.
 */
export declare function getWeekIndexInMonth(date: CalendarDate, monthStart: CalendarDate, locale: string, firstDayOfWeek: AgendaFirstDayOfWeek | undefined): number;
/**
 * Number of week rows needed to render the month containing `monthStart`.
 */
export declare function getWeeksInMonth(monthStart: CalendarDate, locale: string, firstDayOfWeek: AgendaFirstDayOfWeek | undefined): number;
//# sourceMappingURL=agenda.utils.d.ts.map