import {
  Button as PanelButton,
  Typography,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  Chip,
  EmptyState,
  Table,
  Typography as PanelTypography,
  Skeleton as PanelTableSkeleton,
} from "panelui-native";
import { getErrorMessage } from "@/api/api-error";
import { compareTableValues } from "@/utils/table-sort";
import { useCSSVariable } from "uniwind";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useInventoryMovements } from "@/hooks/db/use-inventory-audit";
import type { InventoryMovementType } from "@/api/endpoints/inventory-audit";
import type { TranslationKey } from "@/locales";
import { useTranslation } from "@/stores/use-locale";
import {
  formatDateTime,
  formatInventoryQuantity,
  formatRupiah,
  normalizeInventorySource,
} from "@/utils/format";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { Stack } from "expo-router";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

type Movement = App.Data.Merchant.Inventory.InventoryMovementData;
type TableSortDescriptor = { column: string; direction: "ascending" | "descending" };
type MovementFilter = "all" | InventoryMovementType;
type MovementSortColumn =
  | "type"
  | "item"
  | "quantity"
  | "balance_after"
  | "cost_per_unit"
  | "total_cost"
  | "source"
  | "reason"
  | "actor"
  | "moved_at";

const MOVEMENT_TYPES: readonly MovementFilter[] = [
  "all",
  "opening",
  "purchase",
  "sale",
  "reversal",
  "adjustment",
  "waste",
  "damage",
  "return",
];
const SORTABLE_COLUMNS = new Set<MovementSortColumn>([
  "type",
  "item",
  "quantity",
  "balance_after",
  "cost_per_unit",
  "total_cost",
  "source",
  "reason",
  "actor",
  "moved_at",
]);
const SERVER_SORT_COLUMNS = new Set(["moved_at"]);
const TABLE_COLUMNS = [
  { id: "type", width: 150, label: "movements.type" },
  { id: "item", width: 220, label: "movements.item" },
  { id: "quantity", width: 150, label: "movements.quantity" },
  { id: "balance_after", width: 150, label: "movements.balanceAfter" },
  { id: "cost_per_unit", width: 150, label: "movements.costPerUnit" },
  { id: "total_cost", width: 150, label: "movements.totalCost" },
  { id: "source", width: 150, label: "movements.source" },
  { id: "reason", width: 220, label: "movements.reason" },
  { id: "actor", width: 170, label: "movements.actor" },
  { id: "moved_at", width: 180, label: "movements.movedAt" },
] as const;
const SKELETON_COLUMN_WIDTHS = [150, 220, 150, 150, 150, 150, 150, 220, 170, 180];
const SKELETON_CELL_WIDTHS = [
  "w-32",
  "w-16",
  "w-20",
  "w-20",
  "w-24",
  "w-32",
  "w-20",
  "w-28",
  "w-28",
];
const COLUMN_LAYOUT = TABLE_COLUMNS.map(({ width }) => ({ width }));
const TABLE_WIDTH = TABLE_COLUMNS.reduce((sum, column) => sum + column.width, 0);
const MOVEMENT_TYPE_COLORS: Record<
  InventoryMovementType,
  "primary" | "success" | "warning" | "destructive"
> = {
  opening: "success",
  purchase: "success",
  sale: "primary",
  reversal: "warning",
  adjustment: "primary",
  waste: "destructive",
  damage: "destructive",
  return: "warning",
};
const MOVEMENT_SOURCE_TRANSLATIONS: Partial<Record<string, TranslationKey>> = {
  order: "movements.sources.order",
  manual: "movements.sources.manual",
  opening: "movements.sources.opening",
  adjustment: "movements.sources.adjustment",
  purchase: "movements.sources.purchase",
  sale: "movements.sources.sale",
  reversal: "movements.sources.reversal",
  waste: "movements.sources.waste",
  damage: "movements.sources.damage",
  return: "movements.sources.return",
  system: "movements.sources.system",
};

function getSortColumn(descriptor: TableSortDescriptor): MovementSortColumn {
  const column = String(descriptor.column) as MovementSortColumn;
  return SORTABLE_COLUMNS.has(column) ? column : "moved_at";
}

function getMovementSort(descriptor: TableSortDescriptor): "moved_at" | "-moved_at" {
  const column = String(descriptor.column);
  if (!SERVER_SORT_COLUMNS.has(column)) return "-moved_at";
  return descriptor.direction === "descending" ? "-moved_at" : "moved_at";
}

function getMovementItem(movement: Movement): string {
  return movement.ingredient?.name ?? movement.product?.name ?? "—";
}

function formatSignedQuantity(value: number): string {
  const quantity = formatInventoryQuantity(Math.abs(value));
  return value > 0 ? `+${quantity}` : value < 0 ? `-${quantity}` : quantity;
}

function sortMovements(items: Movement[], descriptor: TableSortDescriptor): Movement[] {
  const column = getSortColumn(descriptor);
  const direction = descriptor.direction === "descending" ? -1 : 1;
  return [...items].sort((a, b) => {
    let comparison: number;
    switch (column) {
      case "type":
        comparison = a.type.localeCompare(b.type);
        break;
      case "item":
        comparison = getMovementItem(a).localeCompare(getMovementItem(b));
        break;
      case "quantity":
        comparison = a.quantity - b.quantity;
        break;
      case "balance_after":
        comparison = a.balance_after - b.balance_after;
        break;
      case "cost_per_unit":
        comparison = compareTableValues(a.cost_per_unit, b.cost_per_unit);
        break;
      case "total_cost":
        comparison = compareTableValues(a.total_cost, b.total_cost);
        break;
      case "source":
        comparison = a.source.localeCompare(b.source);
        break;
      case "reason":
        comparison = compareTableValues(a.reason, b.reason);
        break;
      case "actor":
        comparison = compareTableValues(a.actor?.name ?? null, b.actor?.name ?? null);
        break;
      case "moved_at":
        comparison = Date.parse(a.moved_at) - Date.parse(b.moved_at);
        break;
    }
    return comparison === 0 ? a.id.localeCompare(b.id) : comparison * direction;
  });
}

export default function InventoryMovementsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useNavigationTheme();
  const [themeColorMuted] = useCSSVariable(["--color-muted-foreground"]) as [string];
  const [movementType, setMovementType] = React.useState<MovementFilter>("all");
  const [sortDescriptor, setSortDescriptor] = React.useState<TableSortDescriptor>({
    column: "moved_at",
    direction: "descending",
  });
  const query = useInventoryMovements({
    type: movementType === "all" ? undefined : movementType,
    sort: getMovementSort(sortDescriptor),
  });
  const movements = query.data?.pages.flatMap((page) => page.data) ?? [];
  const sortedMovements = sortMovements(movements, sortDescriptor);

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu
          {...getToolbarIcon("filter")}
          tintColor={theme.foreground}
          accessibilityLabel={t("movements.filterAccessibility")}
        >
          <Stack.Toolbar.Label>{t("common.filter")}</Stack.Toolbar.Label>
          {MOVEMENT_TYPES.map((value) => (
            <Stack.Toolbar.MenuAction
              key={value}
              onPress={() => setMovementType(value)}
              isOn={movementType === value}
            >
              {value === "all" ? t("common.all") : t(`movements.types.${value}` as TranslationKey)}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <View className="flex-1 bg-background">
        {query.isLoading ? (
          <ScrollView className="flex-1" contentContainerClassName="w-full px-4 py-4 pb-24 md:px-6">
            <ScrollView horizontal>
              <View
                style={{ width: SKELETON_COLUMN_WIDTHS.reduce((sum, width) => sum + width, 0) }}
                accessibilityRole="progressbar"
              >
                <Table.Frame columns={SKELETON_COLUMN_WIDTHS.map((width) => ({ width }))}>
                  <Table.Header>
                    <Table.Row>
                      {SKELETON_COLUMN_WIDTHS.map((_, index) => (
                        <Table.Head key={`heading-${index}`}>
                          <PanelTableSkeleton className="h-3 w-20 rounded-md" />
                        </Table.Head>
                      ))}
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {Array.from({ length: 6 }, (_, rowIndex) => (
                      <Table.Row key={`row-${rowIndex}`}>
                        {SKELETON_COLUMN_WIDTHS.map((_, columnIndex) => (
                          <Table.Cell key={`cell-${rowIndex}-${columnIndex}`}>
                            <PanelTableSkeleton
                              className={
                                columnIndex === 6
                                  ? `h-6 ${SKELETON_CELL_WIDTHS[columnIndex] ?? "w-24"} rounded-full`
                                  : `h-4 ${SKELETON_CELL_WIDTHS[columnIndex] ?? "w-24"} rounded-md`
                              }
                            />
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Frame>
              </View>
            </ScrollView>
          </ScrollView>
        ) : query.isError ? (
          <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
            <PanelErrorAlert variant="destructive">
              <PanelErrorAlert.Indicator />
              <PanelErrorAlert.Content>
                <PanelErrorAlert.Description>
                  {getErrorMessage(query.error)}
                </PanelErrorAlert.Description>
              </PanelErrorAlert.Content>
            </PanelErrorAlert>
            <PanelErrorButton variant="outline" onPress={() => void query.refetch()}>
              {t("common.retry")}
            </PanelErrorButton>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerClassName="w-full px-4 py-4 pb-24 md:px-6"
            refreshControl={
              <RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />
            }
          >
            <View className="flex-1 items-center w-full">
              <ScrollView horizontal showsHorizontalScrollIndicator className="w-full">
                <View style={{ width: TABLE_WIDTH }}>
                  <Table.Frame columns={COLUMN_LAYOUT}>
                    <Table.Header>
                      <Table.Row>
                        {TABLE_COLUMNS.map((column) => (
                          <Table.Head
                            key={column.id}
                            sortable
                            sortDirection={
                              sortDescriptor.column === column.id
                                ? sortDescriptor.direction === "ascending"
                                  ? "asc"
                                  : "desc"
                                : undefined
                            }
                            onPress={() =>
                              setSortDescriptor((previous) => ({
                                column: column.id,
                                direction:
                                  previous.column === column.id &&
                                  previous.direction === "ascending"
                                    ? "descending"
                                    : "ascending",
                              }))
                            }
                          >
                            {t(column.label)}
                          </Table.Head>
                        ))}
                      </Table.Row>
                    </Table.Header>
                    {sortedMovements.length ? (
                      <Table.Body>
                        {sortedMovements.map((movement) => {
                          const normalizedSource = movement.source
                            ?.trim()
                            .toLowerCase()
                            .replace(/[_-]+/g, " ");
                          const sourceKey = normalizedSource
                            ? MOVEMENT_SOURCE_TRANSLATIONS[normalizedSource]
                            : undefined;
                          return (
                            <Table.Row key={movement.id}>
                              <Table.Cell>
                                <Chip size="sm" variant={MOVEMENT_TYPE_COLORS[movement.type]}>
                                  {t(`movements.types.${movement.type}` as TranslationKey)}
                                </Chip>
                              </Table.Cell>
                              <Table.Cell>
                                <PanelTypography type="body-sm" weight="semibold" numberOfLines={1}>
                                  {getMovementItem(movement)}
                                </PanelTypography>
                              </Table.Cell>
                              <Table.Cell>
                                <View className="flex-row items-center gap-2">
                                  <PanelTypography type="body-sm" className="tabular-nums">
                                    {formatSignedQuantity(movement.quantity)}
                                  </PanelTypography>
                                  {movement.ingredient?.base_unit ? (
                                    <Chip size="sm">{movement.ingredient.base_unit}</Chip>
                                  ) : null}
                                </View>
                              </Table.Cell>
                              <Table.Cell labelClassName="tabular-nums">
                                {formatInventoryQuantity(movement.balance_after)}
                              </Table.Cell>
                              <Table.Cell labelClassName="tabular-nums">
                                {movement.cost_per_unit === null
                                  ? "—"
                                  : formatRupiah(movement.cost_per_unit)}
                              </Table.Cell>
                              <Table.Cell labelClassName="tabular-nums">
                                {movement.total_cost === null
                                  ? "—"
                                  : formatRupiah(movement.total_cost)}
                              </Table.Cell>
                              <Table.Cell>
                                {movement.source ? (
                                  <Chip size="sm">
                                    {sourceKey
                                      ? t(sourceKey)
                                      : normalizeInventorySource(movement.source)}
                                  </Chip>
                                ) : (
                                  "—"
                                )}
                              </Table.Cell>
                              <Table.Cell>
                                <PanelTypography type="body-sm" numberOfLines={1}>
                                  {movement.reason ?? "—"}
                                </PanelTypography>
                              </Table.Cell>
                              <Table.Cell>
                                <PanelTypography type="body-sm" numberOfLines={1}>
                                  {movement.actor?.name ?? "—"}
                                </PanelTypography>
                              </Table.Cell>
                              <Table.Cell labelClassName="tabular-nums">
                                {formatDateTime(movement.moved_at)}
                              </Table.Cell>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    ) : (
                      <Table.Empty>
                        <EmptyState className="py-16">
                          <EmptyState.Header>
                            <EmptyState.Media variant="icon">
                              <AppIcon
                                icon={AppIcons.analytics}
                                size={22}
                                color={themeColorMuted}
                              />
                            </EmptyState.Media>
                            <EmptyState.Title>{t("movements.empty")}</EmptyState.Title>
                            <EmptyState.Description>
                              {t("movements.emptyDescription")}
                            </EmptyState.Description>
                          </EmptyState.Header>
                        </EmptyState>
                      </Table.Empty>
                    )}
                  </Table.Frame>
                </View>
              </ScrollView>
              {query.hasNextPage ? (
                <View className="w-full flex-row items-center justify-between gap-3 p-4">
                  <Typography type="body-xs" muted>
                    {t("movements.loadedCount", { count: sortedMovements.length })}
                  </Typography>
                  <PanelButton
                    size="sm"
                    variant="ghost"
                    onPress={() => query.fetchNextPage()}
                    disabled={query.isFetchingNextPage}
                  >
                    {query.isFetchingNextPage
                      ? t("movements.loadingMore")
                      : t("movements.loadMore")}
                  </PanelButton>
                </View>
              ) : null}
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
}
