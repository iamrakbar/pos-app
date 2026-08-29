/**
 * Display names for all Table compound parts.
 */
export declare const DISPLAY_NAME: {
    readonly ROOT: "HeroUINative.Table";
    readonly BACKGROUND: "HeroUINative.Table.Background";
    readonly SCROLL_CONTAINER: "HeroUINative.Table.ScrollContainer";
    readonly CONTENT: "HeroUINative.Table.Content";
    readonly HEADER: "HeroUINative.Table.Header";
    readonly COLUMN: "HeroUINative.Table.Column";
    readonly BODY: "HeroUINative.Table.Body";
    readonly ROW: "HeroUINative.Table.Row";
    readonly CELL: "HeroUINative.Table.Cell";
    readonly SELECT_ALL_CELL: "HeroUINative.Table.SelectAllCell";
    readonly SELECTION_CELL: "HeroUINative.Table.SelectionCell";
    readonly FOOTER: "HeroUINative.Table.Footer";
};
/**
 * Default rotation endpoints for the sort indicator chevron, in degrees.
 * The glyph points up (ascending) at 0° and rotates half a turn for
 * descending. Rotation (not `scaleY`) keeps the sweep direction stable.
 */
export declare const SORT_INDICATOR_ROTATION: [number, number];
/**
 * Default opacity endpoints for the sort indicator ([hidden, visible]).
 * The indicator fades in only for the column driving the active sort.
 */
export declare const SORT_INDICATOR_OPACITY: [number, number];
/** Default timing duration (ms) for sort indicator transitions. */
export declare const SORT_INDICATOR_TIMING_DURATION = 150;
/** Rendered size (pt) of the default sort indicator chevron glyph. */
export declare const SORT_INDICATOR_SIZE = 12;
/**
 * Extra touch area around sortable column headers so the pressable area
 * meets the 44pt minimum despite the compact header row height.
 */
export declare const SORTABLE_COLUMN_HIT_SLOP = 8;
/**
 * Fixed width (pt) of the selection column hosting the checkboxes. Wide
 * enough for a 44pt-equivalent touch target once cell padding is included.
 */
export declare const SELECTION_COLUMN_WIDTH = 48;
/**
 * Check icon size (pt) inside the selection checkboxes. The table renders a
 * compact 20pt checkbox (see `.table__selection-checkbox`), so the default
 * 18pt icon is scaled down proportionally (18/24 of the box size).
 */
export declare const SELECTION_CHECKBOX_ICON_SIZE = 15;
//# sourceMappingURL=table.constants.d.ts.map