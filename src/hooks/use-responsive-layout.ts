import { useWindowDimensions } from "react-native";

export const COMPACT_LAYOUT_MAX_WIDTH = 599;
export const MEDIUM_LAYOUT_MAX_WIDTH = 899;

export type ResponsiveLayout = {
  width: number;
  height: number;
  isCompact: boolean;
  isMedium: boolean;
  isWide: boolean;
  isPortrait: boolean;
  horizontalPagePadding: number;
};

export function getResponsiveLayout(width: number, height: number): ResponsiveLayout {
  const isCompact = width <= COMPACT_LAYOUT_MAX_WIDTH;
  const isMedium = width > COMPACT_LAYOUT_MAX_WIDTH && width <= MEDIUM_LAYOUT_MAX_WIDTH;

  return {
    width,
    height,
    isCompact,
    isMedium,
    isWide: width > MEDIUM_LAYOUT_MAX_WIDTH,
    isPortrait: height > width,
    horizontalPagePadding: isCompact ? 16 : 24,
  };
}

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();

  return getResponsiveLayout(width, height);
}
