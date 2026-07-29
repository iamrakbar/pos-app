export declare const flipCardClassNames: import("../../helpers/internal/types").CombinedStyles<{
    root: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "flip-card__root", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "flip-card__root", unknown, unknown, undefined>>;
    front: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "flip-card__front", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "flip-card__front", unknown, unknown, undefined>>;
    back: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "flip-card__back", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "flip-card__back", unknown, unknown, undefined>>;
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