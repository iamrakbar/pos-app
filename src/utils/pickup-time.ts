export const TIME_PICKER_INTERVAL_MINUTES = 5;

export function formatTimeValue(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function getNextPickupTime(now = new Date()): string | null {
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes() + 1;
  const roundedMinutes =
    Math.ceil(minutesSinceMidnight / TIME_PICKER_INTERVAL_MINUTES) * TIME_PICKER_INTERVAL_MINUTES;

  if (roundedMinutes >= 24 * 60) return null;

  return formatTimeValue(Math.floor(roundedMinutes / 60), roundedMinutes % 60);
}

export function isPastPickupTime(value: string, now = new Date()): boolean {
  const [hour, minute] = value.split(":").map(Number);

  return hour * 60 + minute <= now.getHours() * 60 + now.getMinutes();
}
