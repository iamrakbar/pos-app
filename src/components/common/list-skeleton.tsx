import { Skeleton } from "heroui-native";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";
import type { JSX } from "react";

type ListSkeletonProps = {
  rows?: number;
  className?: string;
  fill?: boolean;
};

type GridSkeletonProps = {
  columns: number;
  items?: number;
  width: number;
  horizontalPadding?: number;
  gap?: number;
  aspectRatio?: number;
};

function SkeletonRow(): JSX.Element {
  return (
    <View className="min-h-20 flex-row items-center gap-4 px-4 py-3 md:px-6">
      <Skeleton className="size-11 shrink-0 rounded-panel-inner" />
      <View className="flex-1 gap-2">
        <Skeleton className="h-4 w-3/5 rounded-md" />
        <Skeleton className="h-3 w-2/5 rounded-md" />
        <Skeleton className="h-3 w-1/3 rounded-md" />
      </View>
      <Skeleton className="size-4 rounded-full" />
    </View>
  );
}

export function ListSkeleton({
  rows = 6,
  className = "",
  fill = true,
}: ListSkeletonProps): JSX.Element {
  return (
    <View
      className={`${fill ? "flex-1" : ""} gap-px py-2 ${className}`}
      accessibilityRole="progressbar"
    >
      {Array.from({ length: rows }, (_, index) => (
        <SkeletonRow key={`list-skeleton-${index}`} />
      ))}
    </View>
  );
}

export function GridSkeleton({
  columns,
  items = columns * 2,
  width,
  horizontalPadding = 16,
  gap = 16,
  aspectRatio = 1,
}: GridSkeletonProps): JSX.Element {
  const cardWidth = Math.max(0, (width - horizontalPadding * 2 - gap * (columns - 1)) / columns);
  const cardStyle: StyleProp<ViewStyle> = { width: cardWidth, aspectRatio };

  return (
    <View
      className="flex-1 flex-row flex-wrap content-start gap-y-4 py-6"
      style={{ paddingHorizontal: horizontalPadding, columnGap: gap }}
      accessibilityRole="progressbar"
    >
      {Array.from({ length: items }, (_, index) => (
        <View
          key={`grid-skeleton-${index}`}
          style={cardStyle}
          className="overflow-hidden rounded-panel"
        >
          <Skeleton className="h-full w-full rounded-panel" />
        </View>
      ))}
    </View>
  );
}
