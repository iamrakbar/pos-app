import { getErrorMessage } from "@/api/api-error";
import {
  Fab,
  PlusIcon,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  Skeleton as PanelGridSkeleton,
 EmptyState, Card } from "panelui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";
import { useAreas } from "@/hooks/db/use-areas";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, View } from "react-native";
import AreaFormDialog from "./area-form-dialog";
import { useTranslation } from "@/stores/use-locale";

type AreaData = App.Data.Merchant.Area.AreaData;

export default function AreasScreen(): React.JSX.Element {
  const fabInsets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const { width, isCompact, isMedium, horizontalPagePadding } = useResponsiveLayout();
  const [mutedColor, accentColor] = useCSSVariable([
    "--color-muted-foreground",
    "--color-primary",
  ]) as [string, string];
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
        <View
          className="flex-1 flex-row flex-wrap content-start gap-y-4 py-6"
          style={{ paddingHorizontal: horizontalPagePadding, columnGap: 16 }}
          accessibilityRole="progressbar"
        >
          {Array.from({ length: columnCount * 2 }, (_, index) => (
            <View
              key={`loading-grid-${index}`}
              style={{
                width: Math.max(
                  0,
                  (width - horizontalPagePadding * 2 - 16 * (columnCount - 1)) / columnCount
                ),
                aspectRatio: 1.8,
              }}
              className="overflow-hidden rounded-2xl"
            >
              <PanelGridSkeleton className="h-full w-full rounded-2xl" />
            </View>
          ))}
        </View>
      </View>
    );
  }
  if (areasQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
        <PanelErrorAlert variant="destructive">
          <PanelErrorAlert.Indicator />
          <PanelErrorAlert.Content>
            <PanelErrorAlert.Description>
              {getErrorMessage(areasQuery.error)}
            </PanelErrorAlert.Description>
          </PanelErrorAlert.Content>
        </PanelErrorAlert>
        <PanelErrorButton variant="outline" onPress={() => void areasQuery.refetch()}>
          {t("common.retry")}
        </PanelErrorButton>
      </View>
    );
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
          <Card className="gap-4 p-4" style={{ width: cardWidth }}>
            <Card.Content className="flex-row gap-3 active:bg-surface-secondary p-0">
              <View className="size-12 items-center justify-center rounded-xl bg-accent">
                <AppIcon icon={AppIcons.restaurant} size={20} color={accentColor} />
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
            </Card.Content>
            <Card.Footer className="flex-row gap-4 p-0">
              <PanelErrorButton
                size="sm"
                variant="outline"
                accessibilityLabel={t("areasManagement.openTablesAccessibility", {
                  area: area.name,
                })}
                onPress={() => router.push(`/settings/areas/${area.id}/tables`)}
                className="flex-1"
              >
                <AppIcon icon={AppIcons.eye} size={18} color={mutedColor} />
                {t("areasManagement.viewTables")}
              </PanelErrorButton>
              <PanelErrorButton
                size="sm"
                variant="outline"
                accessibilityLabel={t("areasManagement.editAreaAccessibility", {
                  area: area.name,
                })}
                onPress={() => openEdit(area)}
                className="flex-1"
              >
                <AppIcon icon={AppIcons.pencil} size={18} color={mutedColor} />
                {t("areasManagement.editAreaAction")}
              </PanelErrorButton>
            </Card.Footer>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState className="flex-1 justify-center">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <AppIcon icon={AppIcons.storefront} size={20} color={mutedColor} />
              </EmptyState.Media>
              <EmptyState.Title>{t("areasManagement.emptyAreas")}</EmptyState.Title>
              <EmptyState.Description>
                {t("areasManagement.emptyAreasDescription")}
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        }
      />
      <Fab
        icon={<PlusIcon size={22} />}
        placement="bottom-right"
        style={{ bottom: Math.max(fabInsets.bottom, 24), right: 24, zIndex: 50 }}
        accessibilityLabel={t("areasManagement.addAreaAccessibility")}
        onPress={openCreate}
      />
      <AreaFormDialog area={editingArea} isOpen={isFormOpen} onOpenChange={setIsFormOpen} />
    </View>
  );
}
