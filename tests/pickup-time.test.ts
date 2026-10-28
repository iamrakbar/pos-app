import { test } from "bun:test";
import { formatTimeValue, getNextPickupTime, isPastPickupTime } from "../src/utils/pickup-time";

test("pickup times retain five-minute rounding and day boundaries", () => {
  const morning = new Date(2026, 9, 28, 13, 6);
  if (getNextPickupTime(morning) !== "13:10") throw new Error("Incorrect next pickup time");
  if (!isPastPickupTime("13:05", morning) || isPastPickupTime("13:10", morning))
    throw new Error("Incorrect past-time comparison");
  if (getNextPickupTime(new Date(2026, 9, 28, 23, 59)) !== null)
    throw new Error("Pickup crossed midnight");
  if (formatTimeValue(0, 5) !== "00:05") throw new Error("Time format changed");
});
