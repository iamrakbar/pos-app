import { test } from "bun:test";
import { compareTableValues } from "../src/utils/table-sort";

test("table comparison handles numbers, text and missing values", () => {
  if (compareTableValues(2, 10) >= 0 || compareTableValues(10, 2) <= 0)
    throw new Error("Numeric ordering changed");
  if (compareTableValues("A", "B") >= 0) throw new Error("Text ordering changed");
  if (
    compareTableValues(null, 1) <= 0 ||
    compareTableValues(1, null) >= 0 ||
    compareTableValues(null, null) !== 0
  )
    throw new Error("Missing-value ordering changed");
});
