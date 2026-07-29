import CreateFAB from "@/components/common/create-fab";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import { useAreas } from "@/hooks/db/use-areas";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, Card, useThemeColor } from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import React from "react";
import { FlatList, Pressable, View } from "react-native";
import AreaFormDialog from "./area-form-dialog";

type AreaData = App.Data.Merchant.Area.AreaData;

export default function AreasScreen(): React.JSX.Element {
  const router = useRouter();
  const { width, isCompact, isMedium, horizontalPagePadding } = useResponsiveLayout();
  const [mutedColor, accentColor] = useThemeColor(["muted", "accent"]);
  const areasQuery = useAreas();
  const [editingArea, setEditingArea] = React.useState<AreaData | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const openCreate = () => {
    setEditingArea(null);
    setIsFormOpen(true);
  };

  const openEdit = (area: AreaData) => {
    setEditingArea(area);
    setIsFormOpen(true);
  };

  if (areasQuery.isLoading) return <LoadingState message="Loading areas…" />;
  if (areasQuery.isError) {
    return <ErrorState error={areasQuery.error} onRetry={areasQuery.refetch} />;
  }

  const areas = areasQuery.data ?? [];
  const columnCount = isCompact ? 1 : isMedium ? 2 : 3;
  const cardWidth = (width - horizontalPagePadding * 2 - (columnCount - 1) * 16) / columnCount;

  return (
    <View className="flex-1 bg-background">
      <FlatList
        key={`area-grid-${columnCount}`}
        data={areas}
        numColumns={columnCount}
        keyExtractor={(area) => area.id}
        contentContainerStyle={{
          paddingHorizontal: horizontalPagePadding,
          paddingTop: 24,
          paddingBottom: 104,
          flexGrow: areas.length === 0 ? 1 : undefined,
        }}
        columnWrapperClassName={columnCount > 1 ? "gap-4" : undefined}
        ItemSeparatorComponent={() => <View className="h-4" />}
        renderItem={({ item: area }) => (
          <Card className="min-w-0 p-0 overflow-hidden" style={{ width: cardWidth }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open tables in ${area.name}`}
              onPress={() => router.push(`/settings/areas/${area.id}/tables`)}
              className="min-h-32 flex-1 justify-between gap-6 p-5 active:bg-surface-secondary"
            >
              <View className="size-12 items-center justify-center rounded-panel-inner bg-accent-soft">
                <Ionicons name="storefront-outline" size={20} color={accentColor} />
              </View>
              <View className="gap-1 pr-12">
                <Card.Title numberOfLines={1}>{area.name}</Card.Title>
                <Card.Description>
                  {area.tables_count} table{area.tables_count === 1 ? "" : "s"}
                </Card.Description>
              </View>
            </Pressable>
            <Button
              size="sm"
              variant="outline"
              isIconOnly
              accessibilityLabel={`Edit area ${area.name}`}
              className="absolute right-3 top-3"
              onPress={() => openEdit(area)}
            >
              <Ionicons name="pencil-outline" size={18} color={mutedColor} />
            </Button>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState className="flex-1 justify-center">
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
        }
      />
      <CreateFAB accessibilityLabel="Add seating area" onPress={openCreate} />
      <AreaFormDialog area={editingArea} isOpen={isFormOpen} onOpenChange={setIsFormOpen} />
    </View>
  );
}
