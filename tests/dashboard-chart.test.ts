import { test } from "bun:test";
import { normalizeChartRange } from "../src/utils/dashboard-chart";

test("dashboard chart combines duplicate days and fills the selected date range", () => {
  const actual = normalizeChartRange(
    [
      { date: "2026-10-01T08:00:00", count: 2 },
      { date: "2026-10-01", count: 3 },
      { date: "2026-10-03", count: 7 },
      { date: "2026-09-30", count: 99 },
      { date: "invalid", count: 99 },
    ],
    "2026-10-01",
    "2026-10-03"
  );
  const expected = [
    { date: "2026-10-01", count: 5 },
    { date: "2026-10-02", count: 0 },
    { date: "2026-10-03", count: 7 },
  ];
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected normalized chart: ${JSON.stringify(actual)}`);
  }
});
