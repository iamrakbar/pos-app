import { LOADING_PLACEHOLDER_KEYS } from "@/components/common/loading-placeholder-keys";
import { Skeleton } from "panelui-native";
import { View } from "react-native";

type LoadingListSkeletonProps = {
  count: number;
  fill?: boolean;
};

export default function LoadingListSkeleton({ count, fill = false }: LoadingListSkeletonProps) {
  return (
    <View className={fill ? "flex-1 gap-px py-2" : "gap-px py-2"} accessibilityRole="progressbar">
      {LOADING_PLACEHOLDER_KEYS.slice(0, count).map((slot) => (
        <View key={slot} className="min-h-20 flex-row items-center gap-4 px-4 py-3 md:px-6">
          <Skeleton className="size-11 shrink-0 rounded-xl" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-3/5 rounded-md" />
            <Skeleton className="h-3 w-2/5 rounded-md" />
            <Skeleton className="h-3 w-1/3 rounded-md" />
          </View>
          <Skeleton className="size-4 rounded-full" />
        </View>
      ))}
    </View>
  );
}
