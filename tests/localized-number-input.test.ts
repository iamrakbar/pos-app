import { test } from "bun:test";
import { parseIndonesianNumber } from "../src/hooks/use-localized-number-input";

test("Indonesian numbers preserve grouping, decimal values, and incomplete input", () => {
  const cases: [string, boolean, number][] = [
    ["1.234.567,89", true, 1234567.89],
    ["12,5", false, 12.5],
    ["-0,25", false, -0.25],
    ["", true, Number.NaN],
    ["-", false, Number.NaN],
  ];
  for (const [input, grouped, expected] of cases) {
    const actual = parseIndonesianNumber(input, grouped);
    if (!Object.is(actual, expected)) throw new Error(`Unexpected result for ${input}: ${actual}`);
  }
});
