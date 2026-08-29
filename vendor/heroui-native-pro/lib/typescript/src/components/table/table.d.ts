import { ScrollView, View } from 'react-native';
import * as TablePrimitives from '../../primitives/table';
import type { TableBodyProps, TableCellProps, TableColumnProps, TableContentProps, TableContextValue, TableFooterProps, TableHeaderProps, TableRootProps, TableRowProps, TableScrollContainerProps, TableSelectAllCellProps, TableSelectionCellProps } from './table.types';
declare const useTable: () => TableContextValue;
/** Access to the table's selection/sorting state (primitive root context). */
declare const useTableState: typeof TablePrimitives.useRootContext;
/** Access to the enclosing column's sort state (primitive column context). */
declare const useTableColumn: typeof TablePrimitives.useColumnContext;
/** Access to the enclosing row's state (primitive row context). */
declare const useTableRow: typeof TablePrimitives.useRowContext;
/**
 * Generic body part. Uses a plain function component (rather than
 * `forwardRef`) so the `TItem` generic survives — React 19 forwards `ref`
 * as a regular prop to function components.
 */
declare function TableBodyImpl<TItem = unknown>(props: TableBodyProps<TItem>): import("react/jsx-runtime").JSX.Element;
/**
 * Compound `Table` component with sub-components, ported from the HeroUI
 * web Table and adapted to mobile.
 *
 * @component Table - Root shell. Owns the visual variant, the selection
 * state (`selectionMode`, `selectedKeys`, `disabledKeys`), and the
 * controlled sort descriptor (`sortDescriptor` / `onSortChange`). The table
 * never reorders data itself — consumers sort their items.
 *
 * @component Table.Background - Absolute-fill background container behind
 * the table shell. With no children, the active library theme decides the
 * content (glass theme renders a blur layer with a surface-secondary-matched
 * fallback). Mounted for the primary variant only, replaceable via the
 * `background` prop on Table.
 *
 * @component Table.ScrollContainer - Horizontal `ScrollView` letting wide
 * tables scroll while the shell and footer keep the available width.
 *
 * @component Table.Content - Vertical column hosting the header row and the
 * body; grows to fill the scroll content width.
 *
 * @component Table.Header - Header row hosting `Table.Column` /
 * `Table.SelectAllCell` parts. Injects column positions so body cells align
 * with their columns.
 *
 * @component Table.Column - Header cell. Declares the column width behavior
 * (`width`, or `flex` + `minWidth`); with `allowsSorting`, pressing it
 * toggles the sort descriptor and an animated chevron reflects the active
 * direction.
 *
 * @component Table.Body - Body container. Renders static `Table.Row`
 * children, an `items` collection through a render function, or a
 * virtualized `FlatList` (`virtualized` + `items` + render function with a
 * bounded height). `renderEmptyState` shows centered content when there are
 * no rows.
 *
 * @component Table.Row - Body row. Pressing it toggles selection when
 * `selectionMode` is not `"none"`; `disabledKeys` / `isDisabled` block
 * interaction and dim the row.
 *
 * @component Table.Cell - Body cell. Resolves its width from the header
 * column at the same position; plain string children are wrapped in a
 * styled `Text`.
 *
 * @component Table.SelectAllCell - Header checkbox cell (select-all) for
 * multiple selection tables.
 *
 * @component Table.SelectionCell - Row checkbox cell bound to the row's
 * selection state.
 *
 * @component Table.Footer - Row below the table content (outside the
 * horizontal scroll area), typically hosting load-more actions or summary
 * text.
 *
 * Variant state flows from Table to sub-components via context; selection
 * and sorting state flow through the table primitives.
 *
 * @note RTL: fully handled by logical properties and Yoga flex ordering —
 * columns, cells, separators (`inset-inline-end`), and the secondary header
 * corner radii (`border-top-start-radius` family) all mirror. The sort
 * indicator is a rotation between up/down chevrons (direction-neutral
 * glyphs), so it is deliberately not mirrored.
 */
declare const Table: import("react").ForwardRefExoticComponent<TableRootProps & import("react").RefAttributes<View>> & {
    /** @optional Theme-aware background container behind the table shell. */
    Background: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
        className?: string;
    } & import("react").RefAttributes<View>>;
    /** Horizontal scroll container for the header + body. */
    ScrollContainer: import("react").ForwardRefExoticComponent<TableScrollContainerProps & import("react").RefAttributes<ScrollView>>;
    /** Vertical column hosting the header row and the body. */
    Content: import("react").ForwardRefExoticComponent<TableContentProps & import("react").RefAttributes<View>>;
    /** Header row hosting the column parts. */
    Header: import("react").ForwardRefExoticComponent<TableHeaderProps & import("react").RefAttributes<View>>;
    /** Header cell declaring width/sorting behavior for its column. */
    Column: import("react").ForwardRefExoticComponent<TableColumnProps & import("react").RefAttributes<View>>;
    /** Body container (static rows, dynamic items, or virtualized). */
    Body: typeof TableBodyImpl & {
        displayName: "HeroUINative.Table.Body";
    };
    /** Body row with press-to-select behavior. */
    Row: import("react").ForwardRefExoticComponent<TableRowProps & import("react").RefAttributes<View>>;
    /** Body cell resolving its width from the matching header column. */
    Cell: import("react").ForwardRefExoticComponent<TableCellProps & import("react").RefAttributes<View>>;
    /** @optional Header select-all checkbox cell (multiple selection). */
    SelectAllCell: import("react").ForwardRefExoticComponent<TableSelectAllCellProps & import("react").RefAttributes<View>>;
    /** @optional Row selection checkbox cell. */
    SelectionCell: import("react").ForwardRefExoticComponent<TableSelectionCellProps & import("react").RefAttributes<View>>;
    /** @optional Footer row below the table content. */
    Footer: import("react").ForwardRefExoticComponent<TableFooterProps & import("react").RefAttributes<View>>;
};
export default Table;
export { useTable, useTableColumn, useTableRow, useTableState };
//# sourceMappingURL=table.d.ts.map