import { useThemeColor } from 'heroui-native';

export function useNavigationTheme() {
  const [
    background,
    foreground,
    muted,
    surface,
    surfaceSecondary,
    border,
    accent,
  ] = useThemeColor([
    'background',
    'foreground',
    'muted',
    'surface',
    'surface-secondary',
    'border',
    'accent',
  ] as const);

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
