import CreateFAB from "@/components/common/create-fab";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import { useAreas } from "@/hooks/db/use-areas";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Separator, Typography, useThemeColor } from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

export default function AreasScreen(): React.JSX.Element {
  const router = useRouter();
  const [mutedColor, accentColor] = useThemeColor(["muted", "accent"]);
  const areasQuery = useAreas();

  if (areasQuery.isLoading) return <LoadingState message="Loading areas…" />;
  if (areasQuery.isError) {
    return <ErrorState error={areasQuery.error} onRetry={areasQuery.refetch} />;
  }

  const areas = areasQuery.data ?? [];

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="py-2 pb-24">
        {areas.length === 0 ? (
          <EmptyState className="py-20">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <Ionicons name="storefront-outline" size={20} color={mutedColor} />
              </EmptyState.Media>
              <EmptyState.Title>No seating areas</EmptyState.Title>
              <EmptyState.Description>
                Create an area such as Indoor, Terrace, or Rooftop.
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        ) : (
          areas.map((area, index) => (
            <View key={area.id}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${area.name}`}
                onPress={() => router.push(`/settings/areas/${area.id}`)}
                className="min-h-20 flex-row items-center gap-4 px-4 py-3 active:bg-surface-secondary md:px-6"
              >
                <View className="size-11 items-center justify-center rounded-panel-inner bg-accent-soft">
                  <Ionicons name="storefront-outline" size={20} color={accentColor} />
                </View>
                <View className="flex-1 gap-1">
                  <Typography type="body-sm" weight="semibold">
                    {area.name}
                  </Typography>
                  <Typography type="body-xs" color="muted">
                    {area.tables_count} table{area.tables_count === 1 ? "" : "s"}
                  </Typography>
                </View>
                <Ionicons name="chevron-forward" size={17} color={mutedColor} />
              </Pressable>
              {index < areas.length - 1 ? <Separator className="mx-5" /> : null}
            </View>
          ))
        )}
      </ScrollView>
      <CreateFAB
        accessibilityLabel="Add seating area"
        onPress={() => router.push("/settings/areas/new")}
      />
    </View>
  );
}
