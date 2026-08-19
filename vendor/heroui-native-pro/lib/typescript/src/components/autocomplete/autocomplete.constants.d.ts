/**
 * Default snap points for the bottom-sheet presentation. A tall fixed snap
 * point keeps the content above the search keyboard (module-level constant
 * so the array reference stays stable across renders).
 */
export declare const BOTTOM_SHEET_SNAP_POINTS: string[];
/**
 * Default per-presentation delay in milliseconds before focusing the search
 * input after the overlay opens. Gives the presentation time to settle so
 * the focus reliably shows the keyboard on both platforms — the bottom
 * sheet needs longer for its entering animation than the popover and
 * dialog. Overridable per usage via the `autoFocusDelay` prop on
 * `Autocomplete.SearchField`.
 */
export declare const SEARCH_FIELD_AUTO_FOCUS_DELAY_MAP: Record<'popover' | 'bottom-sheet' | 'dialog', number>;
export declare const DISPLAY_NAME: {
    ROOT: string;
    TRIGGER: string;
    VALUE: string;
    TRIGGER_INDICATOR: string;
    CLEAR_BUTTON: string;
    PORTAL: string;
    OVERLAY: string;
    CONTENT: string;
    CONTENT_BACKGROUND: string;
    SEARCH_FIELD: string;
    LIST: string;
    ITEM: string;
    ITEM_LABEL: string;
    ITEM_DESCRIPTION: string;
    ITEM_INDICATOR: string;
    LIST_LABEL: string;
    EMPTY: string;
    CLOSE: string;
};
//# sourceMappingURL=autocomplete.constants.d.ts.map