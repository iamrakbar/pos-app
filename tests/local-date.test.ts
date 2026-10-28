import { test } from "bun:test";
import {
  formatLocalDate,
  inclusiveLocalCalendarDays,
  parseLocalDate,
} from "../src/utils/local-date";

test("API dates round-trip as local calendar dates", () => {
  for (const value of ["2024-02-29", "2026-01-01", "2026-12-31"]) {
    const date = parseLocalDate(value);
    if (date.getHours() !== 0 || formatLocalDate(date) !== value) {
      throw new Error(`Date shifted when round-tripped: ${value}`);
    }
  }
});

test("inclusive range length counts calendar days across daylight-saving and leap days", () => {
  const cases: [string, string, number][] = [
    ["2024-03-09", "2024-03-11", 3],
    ["2024-11-02", "2024-11-04", 3],
    ["2024-02-28", "2024-03-01", 3],
    ["2024-01-01", "2024-12-31", 366],
  ];
  for (const [from, to, expected] of cases) {
    const actual = inclusiveLocalCalendarDays(parseLocalDate(from), parseLocalDate(to));
    if (actual !== expected)
      throw new Error(`Unexpected range length for ${from}–${to}: ${actual}`);
  }
});
