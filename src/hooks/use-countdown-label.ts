import { useState } from "react";

export function useCountdownLabel(target: number | null, prefix: string) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    target === null ? 0 : Math.max(0, Math.ceil((target - Date.now()) / 1000))
  );
  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  const time =
    hours > 0
      ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : `${minutes}:${String(seconds).padStart(2, "0")}`;
  return { accessibilityLabel: `${prefix} ${time}`, onTick: setSecondsLeft };
}

export function countdownTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
}
