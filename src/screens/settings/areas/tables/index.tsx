import { getErrorMessage } from "@/api/api-error";
import {
  Fab,
  PlusIcon,
  Alert,
  Button,
  Chip,
  Typography,
  Skeleton,
  EmptyState,
  Card,
} from "panelui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";
import TableSymbol, { type TableSeatCount } from "@/components/table-symbol";
import { useArea } from "@/hooks/db/use-areas";
import { useAreaTables } from "@/hooks/db/use-tables";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { FlatList, View } from "react-native";
import TableFormDialog from "./table-form-dialog";
import { useTranslation } from "@/stores/use-locale";
import TableQrOverlay from "./table-qr-overlay";

type TableData = App.Data.Merchant.Area.TableData;

function getTableSeatCount(pax: number): TableSeatCount {
  return Math.max(1, Math.min(8, Math.round(pax))) as TableSeatCount;
}

export default function AreaTablesScreen(): React.JSX.Element {
  const fabInsets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { id: areaId } = useLocalSearchParams<{ id: string }>();
  const { width, isCompact, isMedium, isPortrait, horizontalPagePadding } = useResponsiveLayout();
  const [mutedColor, accentColor, accentSoft] = useCSSVariable([
    "--color-muted-foreground",
    "--color-primary",
    "--color-secondary",
  ]) as [string, string, string];
  const areaQuery = useArea(areaId);
  const tablesQuery = useAreaTables(areaId);
  const [editingTable, setEditingTable] = React.useState<TableData | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [qrTable, setQrTable] = React.useState<TableData | null>(null);
  const [isQrOpen, setIsQrOpen] = React.useState(false);

  const openCreate = () => {
    setEditingTable(null);
    setIsFormOpen(true);
  };

  const openEdit = (table: TableData) => {
    setEditingTable(table);
    setIsFormOpen(true);
  };

  const openQr = (table: TableData) => {
    setQrTable(table);
    requestAnimationFrame(() => setIsQrOpen(true));
  };

  const columnCount = isCompact ? 1 : isMedium && isPortrait ? 2 : isMedium ? 3 : 4;
  if (tablesQuery.isLoading) {
    return (
      <View className="flex-1 bg-background">
        <View
          className="flex-1 flex-row flex-wrap content-start gap-y-4 py-6"
          style={{ paddingHorizontal: horizontalPagePadding - 6, columnGap: 12 }}
          accessibilityRole="progressbar"
        >
          {Array.from({ length: columnCount * 2 }, (_, index) => (
            <View
              key={`loading-grid-${index}`}
              style={{
                width: Math.max(
                  0,
                  (width - (horizontalPagePadding - 6) * 2 - 12 * (columnCount - 1)) / columnCount
                ),
                aspectRatio: 0.68,
              }}
              className="overflow-hidden rounded-2xl"
            >
              <Skeleton className="h-full w-full rounded-2xl" />
            </View>
          ))}
        </View>
      </View>
    );
  }
  if (tablesQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
        <Alert variant="destructive">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{getErrorMessage(tablesQuery.error)}</Alert.Description>
          </Alert.Content>
        </Alert>
        <Button variant="outline" onPress={() => void tablesQuery.refetch()}>
          {t("common.retry")}
        </Button>
      </View>
    );
  }

  const tables = tablesQuery.data ?? [];
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
          columnWrapperClassName={columnCount > 1 ? "items-stretch" : ""}
          renderItem={({ item: table }) => {
            const pax = Number(table.pax);
            const seats = t(pax === 1 ? "areasManagement.seatOne" : "areasManagement.seatOther", {
              count: pax,
            });
            const status = table.active ? t("common.active") : t("common.inactive");

            return (
              <Card className="m-2 min-h-40 gap-4 overflow-hidden p-4" style={{ width: cardWidth }}>
                <Card.Content className="flex-1 items-center justify-between gap-2 p-4 active:bg-surface-tertiary">
                  <Chip variant="default">
                    <Chip.Label>
                      <Typography type="body-xs" numberOfLines={1}>
                        {table.name}
                      </Typography>
                    </Chip.Label>
                  </Chip>
                  <TableSymbol
                    seats={getTableSeatCount(Number(table.pax))}
                    scale={0.5}
                    color={table.active ? accentColor : mutedColor}
                    tableColor={table.active ? accentSoft : undefined}
                  />
                  <View className="w-full flex-row flex-wrap items-center justify-between gap-2">
                    <Chip size="sm" variant="default">
                      {seats}
                    </Chip>
                    <Chip size="sm" variant={table.active ? "success" : "default"}>
                      {status}
                    </Chip>
                  </View>
                </Card.Content>
                <Card.Footer className="flex-row gap-4 p-0">
                  <Button
                    size="sm"
                    variant="outline"
                    accessibilityLabel={t("areasManagement.tableQrAccessibility", {
                      table: table.name,
                    })}
                    onPress={() => openQr(table)}
                    className="flex-1"
                    startContent={<AppIcon icon={AppIcons.qrCode} size={16} color={mutedColor} />}
                  >
                    {t("areasManagement.tableQrAction")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    accessibilityLabel={t("areasManagement.editTableAccessibility", {
                      table: table.name,
                      seats,
                      status,
                    })}
                    onPress={() => openEdit(table)}
                    className="flex-1"
                    startContent={<AppIcon icon={AppIcons.pencil} size={18} color={mutedColor} />}
                  >
                    {t("areasManagement.editTableAction")}
                  </Button>
                </Card.Footer>
              </Card>
            );
          }}
          ListEmptyComponent={
            <EmptyState className="flex-1 justify-center">
              <EmptyState.Header>
                <EmptyState.Media variant="icon">
                  <AppIcon icon={AppIcons.restaurant} size={20} color={mutedColor} />
                </EmptyState.Media>
                <EmptyState.Title>{t("areasManagement.emptyTables")}</EmptyState.Title>
                <EmptyState.Description>
                  {t("areasManagement.emptyTablesDescription")}
                </EmptyState.Description>
              </EmptyState.Header>
            </EmptyState>
          }
        />
        <Fab
          icon={<PlusIcon size={22} />}
          placement="bottom-right"
          style={{ bottom: Math.max(fabInsets.bottom, 24), right: 24, zIndex: 50 }}
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
      <TableQrOverlay table={qrTable} isOpen={isQrOpen} onOpenChange={setIsQrOpen} />
    </>
  );
}
