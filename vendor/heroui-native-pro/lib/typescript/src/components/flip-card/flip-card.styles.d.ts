export declare const flipCardClassNames: import("../../helpers/internal/types").CombinedStyles<{
    root: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "relative w-full aspect-[1.6]", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "relative w-full aspect-[1.6]", unknown, unknown, undefined>>;
    front: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "size-full p-3 overflow-hidden rounded-3xl bg-surface", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "size-full p-3 overflow-hidden rounded-3xl bg-surface", unknown, unknown, undefined>>;
    back: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "absolute inset-0 p-3 overflow-hidden rounded-3xl bg-surface", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "absolute inset-0 p-3 overflow-hidden rounded-3xl bg-surface", unknown, unknown, undefined>>;
}>;
/**
 * Native-only style sheet for properties Tailwind cannot express. The
 * `face` entry applies the iOS continuous (squircle) corner curve to both
 * card faces.
 */
export declare const flipCardStyleSheet: {
    face: {
        borderCurve: "continuous";
    };
};
export default flipCardClassNames;
//# sourceMappingURL=flip-card.styles.d.ts.map