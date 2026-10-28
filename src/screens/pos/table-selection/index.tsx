import {
  Button as PanelButton,
  Chip as PanelChip,
  Typography as PanelTypography,
  Skeleton as PanelGridSkeleton,
  ScrollFade,
  EmptyState,
  Card,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import TableSymbol, { type TableSeatCount } from "@/components/table-symbol";
import { useTables } from "@/hooks/db/use-tables";
import { usePOSStore } from "@/stores/use-pos-store";
import type { POSTable } from "@/types/pos";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { Stack, useRouter } from "expo-router";
import type { JSX } from "react";
import { useState } from "react";
import { FlatList, Pressable, View, useWindowDimensions } from "react-native";
import { useTranslation } from "@/stores/use-locale";

function groupTablesByArea(tables: POSTable[]) {
  const groups = new Map<string, { id: string; name: string; tables: POSTable[] }>();

  tables.forEach((table) => {
    const existingGroup = groups.get(table.area_id);
    if (existingGroup) {
      existingGroup.tables.push(table);
    } else {
      groups.set(table.area_id, {
        id: table.area_id,
        name: table.area_name,
        tables: [table],
      });
    }
  });

  return Array.from(groups.values());
}

function getTableSeatCount(pax: number): TableSeatCount {
  return Math.max(1, Math.min(8, Math.round(pax))) as TableSeatCount;
}

export default function TableSelectionScreen(): JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeAreaId, setActiveAreaId] = useState("");
  const [gridWidth, setGridWidth] = useState(0);
  const [accent, muted, accentSoft] = useCSSVariable([
    "--color-primary",
    "--color-muted-foreground",
    "--color-secondary",
    "--color-foreground",
  ]) as [string, string, string, string];
  const { data: tables = [], isLoading } = useTables();
  const selectedTableId = usePOSStore((state) => state.checkoutForm.table_id);
  const updateCheckoutForm = usePOSStore((state) => state.updateCheckoutForm);
  const groups = groupTablesByArea(tables);
  const selectedTable = tables.find((table) => table.id === selectedTableId);
  const resolvedAreaId = groups.some((group) => group.id === activeAreaId)
    ? activeAreaId
    : (selectedTable?.area_id ?? groups[0]?.id ?? "");
  const filteredTables = groups.find((group) => group.id === resolvedAreaId)?.tables ?? [];
  const columnCount = gridWidth >= 520 ? 3 : 2;
  const cardWidth = gridWidth > 0 ? gridWidth / columnCount - 12 : "48%";

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <View
          className="flex-1 flex-row flex-wrap content-start gap-y-4 py-6"
          style={{ paddingHorizontal: 16, columnGap: 12 }}
          accessibilityRole="progressbar"
        >
          {Array.from({ length: (width >= 520 ? 3 : 2) * 2 }, (_, index) => (
            <View
              key={`loading-grid-${index}`}
              style={{
                width: Math.max(
                  0,
                  (width - 16 * 2 - 12 * ((width >= 520 ? 3 : 2) - 1)) / (width >= 520 ? 3 : 2)
                ),
                aspectRatio: 1.15,
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

  const handleSelect = (tableId: string | null) => {
    updateCheckoutForm({ table_id: tableId });
    router.back();
  };

  const renderArea = ({ item: group }: { item: (typeof groups)[number] }) => (
    <PanelChip
      variant={resolvedAreaId === group.id ? "primary" : "default"}
      selected={resolvedAreaId === group.id}
      onPress={() => setActiveAreaId(group.id)}
    >
      {group.name}
    </PanelChip>
  );

  const renderTable = ({ item: table }: { item: POSTable }) => {
    const isSelected = table.id === selectedTableId;
    const seatCount = getTableSeatCount(Number(table.pax));
    const pax = Number(table.pax);
    const seats = t(pax === 1 ? "tables.seatOne" : "tables.seatOther", { count: pax });

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("tables.selectAccessibility", {
          table: table.name,
          seats,
        })}
        accessibilityState={{ selected: isSelected }}
        onPress={() => handleSelect(table.id)}
        style={{ width: cardWidth, margin: 6 }}
      >
        <Card className={isSelected ? "flex-1 p-4" : "flex-1 p-4 bg-inset"}>
          <Card.Content className="flex-1 h-full min-h-32 items-center justify-center gap-2 py-4 p-0">
            <PanelChip variant="default">
              <PanelChip.Label>
                <PanelTypography type="body-xs" numberOfLines={1}>
                  {table.name}
                </PanelTypography>
              </PanelChip.Label>
            </PanelChip>
            <TableSymbol
              seats={seatCount}
              scale={0.5}
              color={isSelected ? accent : muted}
              tableColor={isSelected ? accentSoft : undefined}
            />
            <PanelChip variant="default" className="self-end">
              <PanelChip.Label>
                <PanelTypography type="body-xs" numberOfLines={1}>
                  {seats}
                </PanelTypography>
              </PanelChip.Label>
            </PanelChip>
          </Card.Content>
        </Card>
      </Pressable>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <PanelButton
              variant="outline"
              size="sm"
              onPress={() => handleSelect(null)}
              accessibilityLabel={t("tables.continueWithoutTable")}
            >
              {t("tables.noTable")}
            </PanelButton>
          ),
        }}
      />
      <View className="flex-1 overflow-hidden bg-background pb-safe">
        <View className="flex-1 gap-4 px-4 pt-4">
          <ScrollFade orientation="horizontal" size={32}>
            <FlatList
              data={groups}
              horizontal
              keyExtractor={(group) => group.id}
              renderItem={renderArea}
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 pb-1"
            />
          </ScrollFade>

          {filteredTables.length > 0 ? (
            <FlatList
              key={`table-grid-${columnCount}`}
              className="flex-1"
              data={filteredTables}
              numColumns={columnCount}
              keyExtractor={(table) => table.id}
              renderItem={renderTable}
              showsVerticalScrollIndicator={false}
              contentContainerClassName="pb-4"
              columnWrapperClassName="items-center"
              onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
            />
          ) : (
            <EmptyState className="flex-1 justify-center">
              <EmptyState.Header>
                <EmptyState.Media variant="icon">
                  <AppIcon icon={AppIcons.grid} size={20} color={muted} />
                </EmptyState.Media>
                <EmptyState.Title>{t("tables.empty")}</EmptyState.Title>
                <EmptyState.Description>{t("tables.emptyDescription")}</EmptyState.Description>
              </EmptyState.Header>
            </EmptyState>
          )}
        </View>
      </View>
    </>
  );
}
