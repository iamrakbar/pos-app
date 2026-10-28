import { useCSSVariable } from "uniwind";

export function useNavigationTheme() {
  const [background, foreground, muted, surface, surfaceSecondary, border, accent] = useCSSVariable(
    [
      "--color-background",
      "--color-foreground",
      "--color-muted-foreground",
      "--color-card",
      "--color-surface-secondary",
      "--color-border",
      "--color-primary",
    ]
  ) as [string, string, string, string, string, string, string];

  return {
    background,
    foreground,
    muted,
    surface,
    surfaceSecondary,
    border,
    accent,
  };
}
