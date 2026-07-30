import CreateFAB from "@/components/common/create-fab";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import TableSymbol, { type TableSeatCount } from "@/components/table-symbol";
import { useArea } from "@/hooks/db/use-areas";
import { useAreaTables } from "@/hooks/db/use-tables";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { Card, Chip, useThemeColor } from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import React from "react";
import { FlatList, Pressable, View } from "react-native";
import TableFormDialog from "./table-form-dialog";
import { useTranslation } from "@/stores/use-locale";

type TableData = App.Data.Merchant.Area.TableData;

function getTableSeatCount(pax: number): TableSeatCount {
  return Math.max(1, Math.min(8, Math.round(pax))) as TableSeatCount;
}

export default function AreaTablesScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { areaId } = useLocalSearchParams<{ areaId: string }>();
  const { width, isCompact, isMedium, horizontalPagePadding } = useResponsiveLayout();
  const [mutedColor, accentColor, accentSoft] = useThemeColor(["muted", "accent", "accent-soft"]);
  const areaQuery = useArea(areaId);
  const tablesQuery = useAreaTables(areaId);
  const [editingTable, setEditingTable] = React.useState<TableData | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const openCreate = () => {
    setEditingTable(null);
    setIsFormOpen(true);
  };

  const openEdit = (table: TableData) => {
    setEditingTable(table);
    setIsFormOpen(true);
  };

  if (tablesQuery.isLoading) return <LoadingState message={t("areasManagement.loadingTables")} />;
  if (tablesQuery.isError) {
    return <ErrorState error={tablesQuery.error} onRetry={tablesQuery.refetch} />;
  }

  const tables = tablesQuery.data ?? [];
  const columnCount = isCompact ? 2 : isMedium ? 3 : 4;
  const listHorizontalPadding = horizontalPagePadding - 6;
  const cardWidth = (width - listHorizontalPadding * 2) / columnCount - 16;

  return (
    <>
      <Stack.Screen options={{ title: areaQuery.data?.name ?? t("areasManagement.tablesTitle") }} />
      <View className="flex-1 bg-background">
        <FlatList
          key={`table-grid-${columnCount}`}
          data={tables}
          numColumns={columnCount}
          keyExtractor={(table) => table.id}
          contentContainerStyle={{
            paddingHorizontal: listHorizontalPadding,
            paddingTop: 18,
            paddingBottom: 104,
            flexGrow: tables.length === 0 ? 1 : undefined,
          }}
          columnWrapperClassName="items-stretch"
          renderItem={({ item: table }) => {
            const pax = Number(table.pax);
            const seats = t(pax === 1 ? "areasManagement.seatOne" : "areasManagement.seatOther", {
              count: pax,
            });
            const status = table.active ? t("common.active") : t("common.inactive");

            return (
              <Card className="m-2 p-0 min-h-40 overflow-hidden" style={{ width: cardWidth }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("areasManagement.editTableAccessibility", {
                    table: table.name,
                    seats,
                    status,
                  })}
                  onPress={() => openEdit(table)}
                  className="flex-1 items-center justify-between gap-2 p-4 active:bg-surface-tertiary"
                >
                  <Chip color="default">
                    <Chip.Label numberOfLines={1}>{table.name}</Chip.Label>
                  </Chip>
                  <TableSymbol
                    seats={getTableSeatCount(Number(table.pax))}
                    scale={0.5}
                    color={table.active ? accentColor : mutedColor}
                    tableColor={table.active ? accentSoft : undefined}
                  />
                  <View className="w-full flex-row flex-wrap items-center justify-between gap-2">
                    <Chip size="sm" color="default" variant="soft">
                      <Chip.Label numberOfLines={1}>{seats}</Chip.Label>
                    </Chip>
                    <Chip size="sm" color={table.active ? "success" : "default"} variant="soft">
                      <Chip.Label>{status}</Chip.Label>
                    </Chip>
                  </View>
                </Pressable>
              </Card>
            );
          }}
          ListEmptyComponent={
            <EmptyState className="flex-1 justify-center">
              <EmptyState.Header>
                <EmptyState.Media variant="icon">
                  <Ionicons name="restaurant-outline" size={20} color={mutedColor} />
                </EmptyState.Media>
                <EmptyState.Title>{t("areasManagement.emptyTables")}</EmptyState.Title>
                <EmptyState.Description>
                  {t("areasManagement.emptyTablesDescription")}
                </EmptyState.Description>
              </EmptyState.Header>
            </EmptyState>
          }
        />
        <CreateFAB
          accessibilityLabel={t("areasManagement.addTableAccessibility")}
          onPress={openCreate}
        />
      </View>

      <TableFormDialog
        areaId={areaId}
        table={editingTable}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </>
  );
}
