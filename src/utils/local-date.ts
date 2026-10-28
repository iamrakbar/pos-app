/** Convert a calendar date to an API date without a UTC conversion. */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Read an API date as midnight in the device's local timezone. */
export function parseLocalDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

/** Count inclusive calendar days without daylight-saving transitions changing the result. */
export function inclusiveLocalCalendarDays(start: Date, end: Date): number {
  const dayNumber = (date: Date) =>
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;
  return dayNumber(end) - dayNumber(start) + 1;
}
