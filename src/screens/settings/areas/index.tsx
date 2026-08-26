import CreateFAB from "@/components/common/create-fab";
import ErrorState from "@/components/common/error-state";
import { GridSkeleton } from "@/components/common/list-skeleton";
import { useAreas } from "@/hooks/db/use-areas";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import AppIcon from "@/components/common/app-icon";
import { useRouter } from "expo-router";
import { Button, Card, useThemeColor } from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import React from "react";
import { FlatList, View } from "react-native";
import AreaFormDialog from "./area-form-dialog";
import { useTranslation } from "@/stores/use-locale";

type AreaData = App.Data.Merchant.Area.AreaData;

export default function AreasScreen(): React.JSX.Element {
  const { t } = useTranslation();
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

  const columnCount = isCompact ? 1 : isMedium ? 2 : 3;
  if (areasQuery.isLoading) {
    return (
      <View className="flex-1 bg-background">
        <GridSkeleton
          columns={columnCount}
          width={width}
          horizontalPadding={horizontalPagePadding}
          gap={16}
          aspectRatio={1.2}
        />
      </View>
    );
  }
  if (areasQuery.isError) {
    return <ErrorState error={areasQuery.error} onRetry={areasQuery.refetch} />;
  }

  const areas = areasQuery.data ?? [];
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
          <Card className="gap-4" style={{ width: cardWidth }}>
            <Card.Body className="flex-row gap-3 active:bg-surface-secondary">
              <View className="size-12 items-center justify-center rounded-panel-inner bg-accent-soft">
                <AppIcon name="restaurant-outline" size={20} color={accentColor} />
              </View>
              <View>
                <Card.Title numberOfLines={1}>{area.name}</Card.Title>
                <Card.Description>
                  {t(
                    area.tables_count === 1
                      ? "areasManagement.tableOne"
                      : "areasManagement.tableOther",
                    { count: area.tables_count }
                  )}
                </Card.Description>
              </View>
            </Card.Body>
            <Card.Footer className="flex-row gap-4">
              <Button
                size="sm"
                variant="outline"
                accessibilityLabel={t("areasManagement.openTablesAccessibility", {
                  area: area.name,
                })}
                onPress={() => router.push(`/settings/areas/${area.id}/tables`)}
                className="flex-1"
              >
                <AppIcon name="eye-outline" size={18} color={mutedColor} />
                <Button.Label className="ml-2">{t("areasManagement.viewTables")}</Button.Label>
              </Button>
              <Button
                size="sm"
                variant="outline"
                accessibilityLabel={t("areasManagement.editAreaAccessibility", {
                  area: area.name,
                })}
                onPress={() => openEdit(area)}
                className="flex-1"
              >
                <AppIcon name="pencil-outline" size={18} color={mutedColor} />
                <Button.Label className="ml-2">{t("areasManagement.editAreaAction")}</Button.Label>
              </Button>
            </Card.Footer>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState className="flex-1 justify-center">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <AppIcon name="storefront-outline" size={20} color={mutedColor} />
              </EmptyState.Media>
              <EmptyState.Title>{t("areasManagement.emptyAreas")}</EmptyState.Title>
              <EmptyState.Description>
                {t("areasManagement.emptyAreasDescription")}
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        }
      />
      <CreateFAB
        accessibilityLabel={t("areasManagement.addAreaAccessibility")}
        onPress={openCreate}
      />
      <AreaFormDialog area={editingArea} isOpen={isFormOpen} onOpenChange={setIsFormOpen} />
    </View>
  );
}
