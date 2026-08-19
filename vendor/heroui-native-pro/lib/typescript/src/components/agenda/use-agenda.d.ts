import type { AgendaCalendarInternalContextValue, AgendaContextValue, AgendaDayColumnContextValue, AgendaEvent, AgendaInternalContextValue, AgendaPageContextValue, AgendaPageInternalContextValue, AgendaTimeGridInternalContextValue, UseAgendaOptions, UseAgendaReturn } from './agenda.types';
declare const AgendaProvider: import("react").Provider<AgendaContextValue>, useAgendaContext: () => AgendaContextValue;
declare const AgendaInternalProvider: import("react").Provider<AgendaInternalContextValue>, useAgendaInternal: () => AgendaInternalContextValue;
declare const AgendaPageProvider: import("react").Provider<AgendaPageContextValue>, useAgendaPage: () => AgendaPageContextValue;
declare const AgendaPageInternalProvider: import("react").Provider<AgendaPageInternalContextValue>, useAgendaPageInternal: () => AgendaPageInternalContextValue;
declare const AgendaTimeGridInternalProvider: import("react").Provider<AgendaTimeGridInternalContextValue>, useAgendaTimeGridInternal: () => AgendaTimeGridInternalContextValue;
declare const AgendaDayColumnProvider: import("react").Provider<AgendaDayColumnContextValue>, useAgendaDayColumn: () => AgendaDayColumnContextValue;
declare const AgendaCalendarInternalProvider: import("react").Provider<AgendaCalendarInternalContextValue>, useAgendaCalendarInternal: () => AgendaCalendarInternalContextValue;
declare const AgendaEventProvider: import("react").Provider<AgendaEvent | undefined>, useAgendaEventOptional: () => AgendaEvent | undefined;
/**
 * Returns the event of the surrounding item template (`Agenda.DayColumns`,
 * `Agenda.AllDaySection`, or `Agenda.MonthGrid` children). Throws outside a template.
 */
declare function useAgendaEvent(): AgendaEvent;
export { AgendaCalendarInternalProvider, AgendaDayColumnProvider, AgendaEventProvider, AgendaInternalProvider, AgendaPageInternalProvider, AgendaPageProvider, AgendaProvider, AgendaTimeGridInternalProvider, useAgendaCalendarInternal, useAgendaContext, useAgendaDayColumn, useAgendaEvent, useAgendaEventOptional, useAgendaInternal, useAgendaPage, useAgendaPageInternal, useAgendaTimeGridInternal, };
/**
 * Shared header-collapse behavior for calendar date presses, the Today button, and
 * view selector changes.
 *
 * The accompanying state update runs first as a React transition (the pager moves to
 * the new date / view while the JS thread renders the heavy content concurrently);
 * the SplitView collapses to the week row right after that transition commits, so
 * the snap spring starts on an idle JS thread and stays smooth.
 */
export declare function useAgendaHeaderCollapse(): (update?: () => void) => void;
/**
 * Pages mount their grid chrome urgently and bring the event chips in with a
 * delayed follow-up transition: view switches show the empty grid immediately, the
 * selector indicator animates unobstructed, and the data layer "arrives" once the
 * indicator has settled. Pages prefetched by the pager mount offscreen, so their
 * chips are usually ready before a swipe lands on them.
 */
export declare function useDeferredEventsLayer(): boolean;
/**
 * Builds the Agenda state from options and returns the resolved state, layout
 * helpers, navigation actions, and interaction callbacks — web Agenda parity.
 *
 * Spread the returned object into the `Agenda` root:
 *
 * ```tsx
 * const agenda = useAgenda({ events, defaultView: 'week', onEventMove });
 * return <Agenda {...agenda}>...</Agenda>;
 * ```
 *
 * Inside the Agenda subtree, compound parts read the same state through
 * {@link useAgendaContext}.
 */
export declare function useAgenda(options: UseAgendaOptions): UseAgendaReturn;
//# sourceMappingURL=use-agenda.d.ts.map