declare const CartesianChart: typeof import("victory-native").CartesianChart;
type InputFieldType = number | string;
type MaybeNumber = number | null | undefined;
/**
 * Keys of `T` whose values are valid x-axis input types (`number` or `string`).
 *
 * Mirrors victory-native's internal `InputFields` helper (not re-exported from the package) so
 * `BaseCartesianChart` can be parameterized with the same generic constraints as `CartesianChart`.
 */
export type BaseCartesianChartInputFields<T> = {
    [K in keyof T as T[K] extends InputFieldType ? K : never]: T[K] extends InputFieldType ? T[K] : never;
};
/**
 * Keys of `T` whose values are numeric (or nullable) y-axis fields.
 *
 * Mirrors victory-native's internal `NumericalFields` helper.
 */
export type BaseCartesianChartNumericalFields<T> = {
    [K in keyof T as T[K] extends MaybeNumber ? K : never]: T[K];
};
/**
 * Union of the parameter types across all `CartesianChart` call signatures.
 *
 * victory-native declares `CartesianChart` with three overloads (horizontal, vertical, and
 * dynamic orientation). `Parameters<typeof CartesianChart<...>>[0]` resolves to the **last**
 * overload only — the dynamic-orientation one, which makes `orientation` required and widens
 * axis label types (e.g. `formatYLabel` becomes `(label: string | number) => string`). That
 * breaks the common vertical usage where `orientation` is omitted. Matching the overload list
 * explicitly recovers all three prop shapes; the single-signature branch is a fallback in case
 * upstream changes the overload count.
 */
type CartesianChartOverloadProps<F> = F extends {
    (props: infer P1): unknown;
    (props: infer P2): unknown;
    (props: infer P3): unknown;
} ? P1 | P2 | P3 : F extends (props: infer P) => unknown ? P : never;
/**
 * Full set of props accepted by `BaseCartesianChart` — identical to the underlying victory-native
 * `CartesianChart` props for the chosen data / x-key / y-keys, across all orientation overloads.
 *
 * We derive the shape from the wrapped component so any additions upstream flow through without
 * needing manual re-declaration.
 */
export type BaseCartesianChartProps<RawData extends Record<string, unknown>, XK extends keyof BaseCartesianChartInputFields<RawData>, YK extends keyof BaseCartesianChartNumericalFields<RawData>> = CartesianChartOverloadProps<typeof CartesianChart<RawData, XK, YK>>;
/**
 * Themed wrapper around victory-native `CartesianChart` that injects sensible defaults for axis
 * styling so the chart visually matches the HeroUI Native theme out of the box.
 *
 * Defaults applied (each overridable through the corresponding victory-native prop):
 * - `xAxis.font` / `yAxis[i].font` — a Skia font built from a platform-aware sans/serif family
 *   (see {@link DEFAULT_AXIS_FONT}).
 * - `xAxis.lineColor` / `yAxis[i].lineColor` — theme `muted` at 15% alpha for subtle gridlines.
 * - `xAxis.labelColor` / `yAxis[i].labelColor` — theme `muted` so tick labels stay legible without
 *   competing with the data series.
 *
 * **Precedence**: defaults are merged first and any property explicitly supplied via `xAxis` or
 * a `yAxis[i]` entry wins (standard spread-merge semantics). If `yAxis` is omitted we still emit
 * one default entry so victory-native always has at least one y-axis to render.
 *
 * **Generics**: `ref` is accepted as a regular prop (React 19 / victory-native) and forwarded via
 * the spread. We intentionally avoid `forwardRef`, which would erase the `RawData` / `XK` / `YK`
 * generic parameters required for strongly-typed `points` in the render callback.
 *
 * @example
 * ```tsx
 * <BaseCartesianChart data={data} xKey="month" yKeys={["revenue"]}>
 *   {({ points }) => <Line points={points.revenue} />}
 * </BaseCartesianChart>
 * ```
 */
export declare function BaseCartesianChart<RawData extends Record<string, unknown>, XK extends keyof BaseCartesianChartInputFields<RawData>, YK extends keyof BaseCartesianChartNumericalFields<RawData>>(props: BaseCartesianChartProps<RawData, XK, YK>): import("react/jsx-runtime").JSX.Element;
export declare namespace BaseCartesianChart {
    var displayName: string;
}
export {};
//# sourceMappingURL=base-cartesian-chart.d.ts.map