/**
 * Header (top SplitView pane): `pane` is the rounded surface card on the animated
 * pane; `content` is the measured natural-height wrapper (drives dynamic snap points).
 */
declare const header: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            content?: import("tailwind-merge").ClassNameValue;
            pane?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            content?: import("tailwind-merge").ClassNameValue;
            pane?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    pane: string;
    content: string;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            content?: import("tailwind-merge").ClassNameValue;
            pane?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    pane: string;
    content: string;
}, import("tailwind-variants").TVReturnType<unknown, {
    pane: string;
    content: string;
}, undefined, unknown, unknown, undefined>>;
/**
 * Collapsible calendar wrapper inside the header.
 *
 * @note ANIMATED PROPERTIES (cannot be set via className):
 * The grid body (inside `gridClip`) animates the following:
 * - `transform` (translateY) - Slides the selected week row into view while collapsing
 */
declare const calendar: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            container?: import("tailwind-merge").ClassNameValue;
            gridClip?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            container?: import("tailwind-merge").ClassNameValue;
            gridClip?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    gridClip: string;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            container?: import("tailwind-merge").ClassNameValue;
            gridClip?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    gridClip: string;
}, import("tailwind-variants").TVReturnType<unknown, {
    container: string;
    gridClip: string;
}, undefined, unknown, unknown, undefined>>;
/**
 * Compact "Today" button preset (`container` on the Button, `label` on its text).
 */
declare const todayButton: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            label?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            label?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    label: string;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            label?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    label: string;
}, import("tailwind-variants").TVReturnType<unknown, {
    container: string;
    label: string;
}, undefined, unknown, unknown, undefined>>;
/**
 * Paged body area inside the SplitView bottom section: `container` is the rounded
 * surface card, `fade` the bottom gradient overlay above the floating selector.
 */
declare const body: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            container?: import("tailwind-merge").ClassNameValue;
            fade?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            container?: import("tailwind-merge").ClassNameValue;
            fade?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    fade: string;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            container?: import("tailwind-merge").ClassNameValue;
            fade?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    fade: string;
}, import("tailwind-variants").TVReturnType<unknown, {
    container: string;
    fade: string;
}, undefined, unknown, unknown, undefined>>;
/**
 * Week header row above the time grid (weekday letters, or names + date pills).
 */
declare const weekHeader: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            cell?: import("tailwind-merge").ClassNameValue;
            day?: import("tailwind-merge").ClassNameValue;
            date?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            cell?: import("tailwind-merge").ClassNameValue;
            day?: import("tailwind-merge").ClassNameValue;
            date?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    cell: string;
    day: import("tailwind-variants").CnReturn;
    date: import("tailwind-variants").CnReturn;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            cell?: import("tailwind-merge").ClassNameValue;
            day?: import("tailwind-merge").ClassNameValue;
            date?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    cell: string;
    day: import("tailwind-variants").CnReturn;
    date: import("tailwind-variants").CnReturn;
}, import("tailwind-variants").TVReturnType<unknown, {
    container: string;
    cell: string;
    day: import("tailwind-variants").CnReturn;
    date: import("tailwind-variants").CnReturn;
}, undefined, unknown, unknown, undefined>>;
/**
 * All-day section above the time grid: packed event bars with per-event color tint.
 */
declare const allDaySection: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            tint?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
            event?: import("tailwind-merge").ClassNameValue;
            eventTitle?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            tint?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
            event?: import("tailwind-merge").ClassNameValue;
            eventTitle?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    event: string;
    eventTitle: string;
    tint: string;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            tint?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
            event?: import("tailwind-merge").ClassNameValue;
            eventTitle?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    event: string;
    eventTitle: string;
    tint: string;
}, import("tailwind-variants").TVReturnType<unknown, {
    container: string;
    event: string;
    eventTitle: string;
    tint: string;
}, undefined, unknown, unknown, undefined>>;
/**
 * Scrollable time grid (hour gutter + hour lines + composed content): `container`
 * is the viewport wrapper, `scroll` the vertical scroll view, and `topFade` the
 * gradient overlay fading content that scrolls under the grid's top edge. The
 * `dragGuide*` slots style the dashed drop guides (projected start/end lines with
 * time labels on the rail) shown while an event is dragged or resized.
 *
 * @note ANIMATED PROPERTIES (cannot be set via className):
 * The `dragGuide` slot animates the following:
 * - `opacity` - Shown only while a drag is active
 * - `transform` (translateY) - Tracks the snapped drop position
 */
declare const timeGrid: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            scroll?: import("tailwind-merge").ClassNameValue;
            content?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
            gutterLabel?: import("tailwind-merge").ClassNameValue;
            hourLine?: import("tailwind-merge").ClassNameValue;
            topFade?: import("tailwind-merge").ClassNameValue;
            dragGuide?: import("tailwind-merge").ClassNameValue;
            dragGuideLine?: import("tailwind-merge").ClassNameValue;
            dragGuideLineDash?: import("tailwind-merge").ClassNameValue;
            dragGuideLabel?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            scroll?: import("tailwind-merge").ClassNameValue;
            content?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
            gutterLabel?: import("tailwind-merge").ClassNameValue;
            hourLine?: import("tailwind-merge").ClassNameValue;
            topFade?: import("tailwind-merge").ClassNameValue;
            dragGuide?: import("tailwind-merge").ClassNameValue;
            dragGuideLine?: import("tailwind-merge").ClassNameValue;
            dragGuideLineDash?: import("tailwind-merge").ClassNameValue;
            dragGuideLabel?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    scroll: string;
    content: string;
    gutterLabel: string;
    hourLine: string;
    topFade: string;
    dragGuide: string;
    dragGuideLine: string;
    dragGuideLineDash: string;
    dragGuideLabel: string;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            scroll?: import("tailwind-merge").ClassNameValue;
            content?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
            gutterLabel?: import("tailwind-merge").ClassNameValue;
            hourLine?: import("tailwind-merge").ClassNameValue;
            topFade?: import("tailwind-merge").ClassNameValue;
            dragGuide?: import("tailwind-merge").ClassNameValue;
            dragGuideLine?: import("tailwind-merge").ClassNameValue;
            dragGuideLineDash?: import("tailwind-merge").ClassNameValue;
            dragGuideLabel?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    scroll: string;
    content: string;
    gutterLabel: string;
    hourLine: string;
    topFade: string;
    dragGuide: string;
    dragGuideLine: string;
    dragGuideLineDash: string;
    dragGuideLabel: string;
}, import("tailwind-variants").TVReturnType<unknown, {
    container: string;
    scroll: string;
    content: string;
    gutterLabel: string;
    hourLine: string;
    topFade: string;
    dragGuide: string;
    dragGuideLine: string;
    dragGuideLineDash: string;
    dragGuideLabel: string;
}, undefined, unknown, unknown, undefined>>;
/**
 * Day columns row: one column per page day with a fading events layer.
 */
declare const dayColumns: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            column?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
            eventsLayer?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            column?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
            eventsLayer?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    column: string;
    eventsLayer: string;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            column?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
            eventsLayer?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    column: string;
    eventsLayer: string;
}, import("tailwind-variants").TVReturnType<unknown, {
    container: string;
    column: string;
    eventsLayer: string;
}, undefined, unknown, unknown, undefined>>;
/**
 * Timed event card.
 *
 * @note ANIMATED PROPERTIES (cannot be set via className):
 * The `container` slot animates the following:
 * - `transform` (scale) - Press / drag feedback
 * - `height` - Live feedback while resizing
 *
 * The `resizeGrabber` slot animates the following:
 * - `transform` (scale) - Scales down while the resize gesture is active
 *
 * To customize the scale, use the `animation` prop on `Agenda.Event`. To disable the
 * decorative scale, set `isAnimatedStyleActive={false}`.
 */
declare const event: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            title?: import("tailwind-merge").ClassNameValue;
            time?: import("tailwind-merge").ClassNameValue;
            tint?: import("tailwind-merge").ClassNameValue;
            content?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
            accentBar?: import("tailwind-merge").ClassNameValue;
            resizeHandle?: import("tailwind-merge").ClassNameValue;
            resizeGrabber?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            title?: import("tailwind-merge").ClassNameValue;
            time?: import("tailwind-merge").ClassNameValue;
            tint?: import("tailwind-merge").ClassNameValue;
            content?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
            accentBar?: import("tailwind-merge").ClassNameValue;
            resizeHandle?: import("tailwind-merge").ClassNameValue;
            resizeGrabber?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: import("tailwind-variants").CnReturn;
    content: string;
    tint: string;
    accentBar: string;
    title: string;
    time: string;
    resizeHandle: string;
    resizeGrabber: import("tailwind-variants").CnReturn;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            title?: import("tailwind-merge").ClassNameValue;
            time?: import("tailwind-merge").ClassNameValue;
            tint?: import("tailwind-merge").ClassNameValue;
            content?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
            accentBar?: import("tailwind-merge").ClassNameValue;
            resizeHandle?: import("tailwind-merge").ClassNameValue;
            resizeGrabber?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: import("tailwind-variants").CnReturn;
    content: string;
    tint: string;
    accentBar: string;
    title: string;
    time: string;
    resizeHandle: string;
    resizeGrabber: import("tailwind-variants").CnReturn;
}, import("tailwind-variants").TVReturnType<unknown, {
    container: import("tailwind-variants").CnReturn;
    content: string;
    tint: string;
    accentBar: string;
    title: string;
    time: string;
    resizeHandle: string;
    resizeGrabber: import("tailwind-variants").CnReturn;
}, undefined, unknown, unknown, undefined>>;
/**
 * Current time indicator (badge + line + notch).
 */
declare const currentTimeIndicator: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            label?: import("tailwind-merge").ClassNameValue;
            line?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
            gutter?: import("tailwind-merge").ClassNameValue;
            badge?: import("tailwind-merge").ClassNameValue;
            dot?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            label?: import("tailwind-merge").ClassNameValue;
            line?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
            gutter?: import("tailwind-merge").ClassNameValue;
            badge?: import("tailwind-merge").ClassNameValue;
            dot?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    gutter: string;
    badge: string;
    line: string;
    dot: string;
    label: string;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            label?: import("tailwind-merge").ClassNameValue;
            line?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
            gutter?: import("tailwind-merge").ClassNameValue;
            badge?: import("tailwind-merge").ClassNameValue;
            dot?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    gutter: string;
    badge: string;
    line: string;
    dot: string;
    label: string;
}, import("tailwind-variants").TVReturnType<unknown, {
    container: string;
    gutter: string;
    badge: string;
    line: string;
    dot: string;
    label: string;
}, undefined, unknown, unknown, undefined>>;
/**
 * Month grid page: weekday row, week rows with spanning bars, and day cells with
 * event chips.
 */
declare const monthGrid: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            cell?: import("tailwind-merge").ClassNameValue;
            row?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
            weekdayRow?: import("tailwind-merge").ClassNameValue;
            weekdayLabel?: import("tailwind-merge").ClassNameValue;
            spanningLayer?: import("tailwind-merge").ClassNameValue;
            spanningEvent?: import("tailwind-merge").ClassNameValue;
            spanningEventTitle?: import("tailwind-merge").ClassNameValue;
            cellEvents?: import("tailwind-merge").ClassNameValue;
            cellEvent?: import("tailwind-merge").ClassNameValue;
            cellEventTitle?: import("tailwind-merge").ClassNameValue;
            cellMore?: import("tailwind-merge").ClassNameValue;
            cellDate?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            cell?: import("tailwind-merge").ClassNameValue;
            row?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
            weekdayRow?: import("tailwind-merge").ClassNameValue;
            weekdayLabel?: import("tailwind-merge").ClassNameValue;
            spanningLayer?: import("tailwind-merge").ClassNameValue;
            spanningEvent?: import("tailwind-merge").ClassNameValue;
            spanningEventTitle?: import("tailwind-merge").ClassNameValue;
            cellEvents?: import("tailwind-merge").ClassNameValue;
            cellEvent?: import("tailwind-merge").ClassNameValue;
            cellEventTitle?: import("tailwind-merge").ClassNameValue;
            cellMore?: import("tailwind-merge").ClassNameValue;
            cellDate?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    weekdayRow: string;
    weekdayLabel: string;
    row: string;
    spanningLayer: string;
    spanningEvent: string;
    spanningEventTitle: string;
    cell: string;
    cellDate: import("tailwind-variants").CnReturn;
    cellEvents: string;
    cellEvent: string;
    cellEventTitle: string;
    cellMore: string;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            cell?: import("tailwind-merge").ClassNameValue;
            row?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
            weekdayRow?: import("tailwind-merge").ClassNameValue;
            weekdayLabel?: import("tailwind-merge").ClassNameValue;
            spanningLayer?: import("tailwind-merge").ClassNameValue;
            spanningEvent?: import("tailwind-merge").ClassNameValue;
            spanningEventTitle?: import("tailwind-merge").ClassNameValue;
            cellEvents?: import("tailwind-merge").ClassNameValue;
            cellEvent?: import("tailwind-merge").ClassNameValue;
            cellEventTitle?: import("tailwind-merge").ClassNameValue;
            cellMore?: import("tailwind-merge").ClassNameValue;
            cellDate?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    weekdayRow: string;
    weekdayLabel: string;
    row: string;
    spanningLayer: string;
    spanningEvent: string;
    spanningEventTitle: string;
    cell: string;
    cellDate: import("tailwind-variants").CnReturn;
    cellEvents: string;
    cellEvent: string;
    cellEventTitle: string;
    cellMore: string;
}, import("tailwind-variants").TVReturnType<unknown, {
    container: string;
    weekdayRow: string;
    weekdayLabel: string;
    row: string;
    spanningLayer: string;
    spanningEvent: string;
    spanningEventTitle: string;
    cell: string;
    cellDate: import("tailwind-variants").CnReturn;
    cellEvents: string;
    cellEvent: string;
    cellEventTitle: string;
    cellMore: string;
}, undefined, unknown, unknown, undefined>>;
export declare const agendaClassNames: import("../../helpers/internal/types").CombinedStyles<{
    root: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "agenda__root shadow-surface", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "agenda__root shadow-surface", unknown, unknown, undefined>>;
    background: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "agenda__background", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "agenda__background", unknown, unknown, undefined>>;
    header: import("tailwind-variants").TVReturnType<{
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                content?: import("tailwind-merge").ClassNameValue;
                pane?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {
        [x: string]: {
            [x: string]: import("tailwind-merge").ClassNameValue | {
                content?: import("tailwind-merge").ClassNameValue;
                pane?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        pane: string;
        content: string;
    }, undefined, {
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                content?: import("tailwind-merge").ClassNameValue;
                pane?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        pane: string;
        content: string;
    }, import("tailwind-variants").TVReturnType<unknown, {
        pane: string;
        content: string;
    }, undefined, unknown, unknown, undefined>>;
    calendar: import("tailwind-variants").TVReturnType<{
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                container?: import("tailwind-merge").ClassNameValue;
                gridClip?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {
        [x: string]: {
            [x: string]: import("tailwind-merge").ClassNameValue | {
                container?: import("tailwind-merge").ClassNameValue;
                gridClip?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        gridClip: string;
    }, undefined, {
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                container?: import("tailwind-merge").ClassNameValue;
                gridClip?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        gridClip: string;
    }, import("tailwind-variants").TVReturnType<unknown, {
        container: string;
        gridClip: string;
    }, undefined, unknown, unknown, undefined>>;
    calendarHeader: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "", unknown, unknown, undefined>>;
    heading: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "agenda__heading", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "agenda__heading", unknown, unknown, undefined>>;
    navButton: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "agenda__nav-button", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "agenda__nav-button", unknown, unknown, undefined>>;
    todayButton: import("tailwind-variants").TVReturnType<{
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                label?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {
        [x: string]: {
            [x: string]: import("tailwind-merge").ClassNameValue | {
                label?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        label: string;
    }, undefined, {
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                label?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        label: string;
    }, import("tailwind-variants").TVReturnType<unknown, {
        container: string;
        label: string;
    }, undefined, unknown, unknown, undefined>>;
    body: import("tailwind-variants").TVReturnType<{
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                container?: import("tailwind-merge").ClassNameValue;
                fade?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {
        [x: string]: {
            [x: string]: import("tailwind-merge").ClassNameValue | {
                container?: import("tailwind-merge").ClassNameValue;
                fade?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        fade: string;
    }, undefined, {
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                container?: import("tailwind-merge").ClassNameValue;
                fade?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        fade: string;
    }, import("tailwind-variants").TVReturnType<unknown, {
        container: string;
        fade: string;
    }, undefined, unknown, unknown, undefined>>;
    page: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "agenda__page", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "agenda__page", unknown, unknown, undefined>>;
    weekHeader: import("tailwind-variants").TVReturnType<{
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                cell?: import("tailwind-merge").ClassNameValue;
                day?: import("tailwind-merge").ClassNameValue;
                date?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {
        [x: string]: {
            [x: string]: import("tailwind-merge").ClassNameValue | {
                cell?: import("tailwind-merge").ClassNameValue;
                day?: import("tailwind-merge").ClassNameValue;
                date?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        cell: string;
        day: import("tailwind-variants").CnReturn;
        date: import("tailwind-variants").CnReturn;
    }, undefined, {
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                cell?: import("tailwind-merge").ClassNameValue;
                day?: import("tailwind-merge").ClassNameValue;
                date?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        cell: string;
        day: import("tailwind-variants").CnReturn;
        date: import("tailwind-variants").CnReturn;
    }, import("tailwind-variants").TVReturnType<unknown, {
        container: string;
        cell: string;
        day: import("tailwind-variants").CnReturn;
        date: import("tailwind-variants").CnReturn;
    }, undefined, unknown, unknown, undefined>>;
    allDaySection: import("tailwind-variants").TVReturnType<{
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                tint?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
                event?: import("tailwind-merge").ClassNameValue;
                eventTitle?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {
        [x: string]: {
            [x: string]: import("tailwind-merge").ClassNameValue | {
                tint?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
                event?: import("tailwind-merge").ClassNameValue;
                eventTitle?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        event: string;
        eventTitle: string;
        tint: string;
    }, undefined, {
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                tint?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
                event?: import("tailwind-merge").ClassNameValue;
                eventTitle?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        event: string;
        eventTitle: string;
        tint: string;
    }, import("tailwind-variants").TVReturnType<unknown, {
        container: string;
        event: string;
        eventTitle: string;
        tint: string;
    }, undefined, unknown, unknown, undefined>>;
    timeGrid: import("tailwind-variants").TVReturnType<{
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                scroll?: import("tailwind-merge").ClassNameValue;
                content?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
                gutterLabel?: import("tailwind-merge").ClassNameValue;
                hourLine?: import("tailwind-merge").ClassNameValue;
                topFade?: import("tailwind-merge").ClassNameValue;
                dragGuide?: import("tailwind-merge").ClassNameValue;
                dragGuideLine?: import("tailwind-merge").ClassNameValue;
                dragGuideLineDash?: import("tailwind-merge").ClassNameValue;
                dragGuideLabel?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {
        [x: string]: {
            [x: string]: import("tailwind-merge").ClassNameValue | {
                scroll?: import("tailwind-merge").ClassNameValue;
                content?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
                gutterLabel?: import("tailwind-merge").ClassNameValue;
                hourLine?: import("tailwind-merge").ClassNameValue;
                topFade?: import("tailwind-merge").ClassNameValue;
                dragGuide?: import("tailwind-merge").ClassNameValue;
                dragGuideLine?: import("tailwind-merge").ClassNameValue;
                dragGuideLineDash?: import("tailwind-merge").ClassNameValue;
                dragGuideLabel?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        scroll: string;
        content: string;
        gutterLabel: string;
        hourLine: string;
        topFade: string;
        dragGuide: string;
        dragGuideLine: string;
        dragGuideLineDash: string;
        dragGuideLabel: string;
    }, undefined, {
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                scroll?: import("tailwind-merge").ClassNameValue;
                content?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
                gutterLabel?: import("tailwind-merge").ClassNameValue;
                hourLine?: import("tailwind-merge").ClassNameValue;
                topFade?: import("tailwind-merge").ClassNameValue;
                dragGuide?: import("tailwind-merge").ClassNameValue;
                dragGuideLine?: import("tailwind-merge").ClassNameValue;
                dragGuideLineDash?: import("tailwind-merge").ClassNameValue;
                dragGuideLabel?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        scroll: string;
        content: string;
        gutterLabel: string;
        hourLine: string;
        topFade: string;
        dragGuide: string;
        dragGuideLine: string;
        dragGuideLineDash: string;
        dragGuideLabel: string;
    }, import("tailwind-variants").TVReturnType<unknown, {
        container: string;
        scroll: string;
        content: string;
        gutterLabel: string;
        hourLine: string;
        topFade: string;
        dragGuide: string;
        dragGuideLine: string;
        dragGuideLineDash: string;
        dragGuideLabel: string;
    }, undefined, unknown, unknown, undefined>>;
    dayColumns: import("tailwind-variants").TVReturnType<{
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                column?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
                eventsLayer?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {
        [x: string]: {
            [x: string]: import("tailwind-merge").ClassNameValue | {
                column?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
                eventsLayer?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        column: string;
        eventsLayer: string;
    }, undefined, {
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                column?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
                eventsLayer?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        column: string;
        eventsLayer: string;
    }, import("tailwind-variants").TVReturnType<unknown, {
        container: string;
        column: string;
        eventsLayer: string;
    }, undefined, unknown, unknown, undefined>>;
    event: import("tailwind-variants").TVReturnType<{
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                title?: import("tailwind-merge").ClassNameValue;
                time?: import("tailwind-merge").ClassNameValue;
                tint?: import("tailwind-merge").ClassNameValue;
                content?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
                accentBar?: import("tailwind-merge").ClassNameValue;
                resizeHandle?: import("tailwind-merge").ClassNameValue;
                resizeGrabber?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {
        [x: string]: {
            [x: string]: import("tailwind-merge").ClassNameValue | {
                title?: import("tailwind-merge").ClassNameValue;
                time?: import("tailwind-merge").ClassNameValue;
                tint?: import("tailwind-merge").ClassNameValue;
                content?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
                accentBar?: import("tailwind-merge").ClassNameValue;
                resizeHandle?: import("tailwind-merge").ClassNameValue;
                resizeGrabber?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: import("tailwind-variants").CnReturn;
        content: string;
        tint: string;
        accentBar: string;
        title: string;
        time: string;
        resizeHandle: string;
        resizeGrabber: import("tailwind-variants").CnReturn;
    }, undefined, {
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                title?: import("tailwind-merge").ClassNameValue;
                time?: import("tailwind-merge").ClassNameValue;
                tint?: import("tailwind-merge").ClassNameValue;
                content?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
                accentBar?: import("tailwind-merge").ClassNameValue;
                resizeHandle?: import("tailwind-merge").ClassNameValue;
                resizeGrabber?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: import("tailwind-variants").CnReturn;
        content: string;
        tint: string;
        accentBar: string;
        title: string;
        time: string;
        resizeHandle: string;
        resizeGrabber: import("tailwind-variants").CnReturn;
    }, import("tailwind-variants").TVReturnType<unknown, {
        container: import("tailwind-variants").CnReturn;
        content: string;
        tint: string;
        accentBar: string;
        title: string;
        time: string;
        resizeHandle: string;
        resizeGrabber: import("tailwind-variants").CnReturn;
    }, undefined, unknown, unknown, undefined>>;
    currentTimeIndicator: import("tailwind-variants").TVReturnType<{
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                label?: import("tailwind-merge").ClassNameValue;
                line?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
                gutter?: import("tailwind-merge").ClassNameValue;
                badge?: import("tailwind-merge").ClassNameValue;
                dot?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {
        [x: string]: {
            [x: string]: import("tailwind-merge").ClassNameValue | {
                label?: import("tailwind-merge").ClassNameValue;
                line?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
                gutter?: import("tailwind-merge").ClassNameValue;
                badge?: import("tailwind-merge").ClassNameValue;
                dot?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        gutter: string;
        badge: string;
        line: string;
        dot: string;
        label: string;
    }, undefined, {
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                label?: import("tailwind-merge").ClassNameValue;
                line?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
                gutter?: import("tailwind-merge").ClassNameValue;
                badge?: import("tailwind-merge").ClassNameValue;
                dot?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        gutter: string;
        badge: string;
        line: string;
        dot: string;
        label: string;
    }, import("tailwind-variants").TVReturnType<unknown, {
        container: string;
        gutter: string;
        badge: string;
        line: string;
        dot: string;
        label: string;
    }, undefined, unknown, unknown, undefined>>;
    monthGrid: import("tailwind-variants").TVReturnType<{
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                cell?: import("tailwind-merge").ClassNameValue;
                row?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
                weekdayRow?: import("tailwind-merge").ClassNameValue;
                weekdayLabel?: import("tailwind-merge").ClassNameValue;
                spanningLayer?: import("tailwind-merge").ClassNameValue;
                spanningEvent?: import("tailwind-merge").ClassNameValue;
                spanningEventTitle?: import("tailwind-merge").ClassNameValue;
                cellEvents?: import("tailwind-merge").ClassNameValue;
                cellEvent?: import("tailwind-merge").ClassNameValue;
                cellEventTitle?: import("tailwind-merge").ClassNameValue;
                cellMore?: import("tailwind-merge").ClassNameValue;
                cellDate?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {
        [x: string]: {
            [x: string]: import("tailwind-merge").ClassNameValue | {
                cell?: import("tailwind-merge").ClassNameValue;
                row?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
                weekdayRow?: import("tailwind-merge").ClassNameValue;
                weekdayLabel?: import("tailwind-merge").ClassNameValue;
                spanningLayer?: import("tailwind-merge").ClassNameValue;
                spanningEvent?: import("tailwind-merge").ClassNameValue;
                spanningEventTitle?: import("tailwind-merge").ClassNameValue;
                cellEvents?: import("tailwind-merge").ClassNameValue;
                cellEvent?: import("tailwind-merge").ClassNameValue;
                cellEventTitle?: import("tailwind-merge").ClassNameValue;
                cellMore?: import("tailwind-merge").ClassNameValue;
                cellDate?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        weekdayRow: string;
        weekdayLabel: string;
        row: string;
        spanningLayer: string;
        spanningEvent: string;
        spanningEventTitle: string;
        cell: string;
        cellDate: import("tailwind-variants").CnReturn;
        cellEvents: string;
        cellEvent: string;
        cellEventTitle: string;
        cellMore: string;
    }, undefined, {
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                cell?: import("tailwind-merge").ClassNameValue;
                row?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
                weekdayRow?: import("tailwind-merge").ClassNameValue;
                weekdayLabel?: import("tailwind-merge").ClassNameValue;
                spanningLayer?: import("tailwind-merge").ClassNameValue;
                spanningEvent?: import("tailwind-merge").ClassNameValue;
                spanningEventTitle?: import("tailwind-merge").ClassNameValue;
                cellEvents?: import("tailwind-merge").ClassNameValue;
                cellEvent?: import("tailwind-merge").ClassNameValue;
                cellEventTitle?: import("tailwind-merge").ClassNameValue;
                cellMore?: import("tailwind-merge").ClassNameValue;
                cellDate?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        weekdayRow: string;
        weekdayLabel: string;
        row: string;
        spanningLayer: string;
        spanningEvent: string;
        spanningEventTitle: string;
        cell: string;
        cellDate: import("tailwind-variants").CnReturn;
        cellEvents: string;
        cellEvent: string;
        cellEventTitle: string;
        cellMore: string;
    }, import("tailwind-variants").TVReturnType<unknown, {
        container: string;
        weekdayRow: string;
        weekdayLabel: string;
        row: string;
        spanningLayer: string;
        spanningEvent: string;
        spanningEventTitle: string;
        cell: string;
        cellDate: import("tailwind-variants").CnReturn;
        cellEvents: string;
        cellEvent: string;
        cellEventTitle: string;
        cellMore: string;
    }, undefined, unknown, unknown, undefined>>;
    viewSelector: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "agenda__view-selector", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "agenda__view-selector", unknown, unknown, undefined>>;
    viewSelectorGroup: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "shadow-overlay", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "shadow-overlay", unknown, unknown, undefined>>;
}>;
export type HeaderSlots = keyof ReturnType<typeof header>;
export type CalendarSlots = keyof ReturnType<typeof calendar>;
export type TodayButtonSlots = keyof ReturnType<typeof todayButton>;
export type BodySlots = keyof ReturnType<typeof body>;
export type WeekHeaderSlots = keyof ReturnType<typeof weekHeader>;
export type AllDaySectionSlots = keyof ReturnType<typeof allDaySection>;
export type TimeGridSlots = keyof ReturnType<typeof timeGrid>;
export type DayColumnsSlots = keyof ReturnType<typeof dayColumns>;
export type EventSlots = keyof ReturnType<typeof event>;
export type CurrentTimeIndicatorSlots = keyof ReturnType<typeof currentTimeIndicator>;
export type MonthGridSlots = keyof ReturnType<typeof monthGrid>;
export declare const agendaStyleSheet: {
    borderCurve: {
        borderCurve: "continuous";
    };
    /**
     * Pins the pager's content row to a physical left-to-right flow. The
     * FlatList virtualization math (`getItemLayout`, `scrollToIndex`,
     * viewability offsets) is physical, so the RTL mirroring happens in the
     * index ↔ date mapping instead of in layout. Pages restore the app
     * direction on their own root (see `pageDirection*`).
     */
    pagerContent: {
        direction: "ltr";
    };
    /**
     * Pins the pager's own list node to LTR as well. On Android, a horizontal
     * FlatList whose node resolves to `rtl` mirrors its scroll offsets, which
     * breaks the `removeClippedSubviews` clipping math against the LTR-pinned
     * content row and blanks pages. Node and content must agree on a physical
     * left-to-right flow.
     */
    pagerList: {
        direction: "ltr";
    };
    /**
     * Inner wrapper hosting the pager list. Page width is measured here — the
     * body's content box — rather than on the body itself, so borders or
     * padding added to `Agenda.Body` by themes (e.g. brutalism's 1px border)
     * or consumer classNames never desync the `pagingEnabled` snap width from
     * the `getItemLayout` page width.
     */
    pagerViewport: {
        flex: number;
    };
    /** Restores the app layout direction inside an LTR-pinned pager page. */
    pageDirectionLTR: {
        direction: "ltr";
    };
    pageDirectionRTL: {
        direction: "rtl";
    };
};
export default agendaClassNames;
//# sourceMappingURL=agenda.styles.d.ts.map