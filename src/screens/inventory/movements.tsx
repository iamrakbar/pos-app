import AppIcon from "@/components/common/app-icon";
import ErrorState from "@/components/common/error-state";
import TableSkeleton from "@/components/common/table-skeleton";
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
import { Button, Chip, Typography, useThemeColor } from "heroui-native";
import { EmptyState, Table, type TableSortDescriptor } from "heroui-native-pro";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

type Movement = App.Data.Merchant.Inventory.InventoryMovementData;
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
const MOVEMENT_TYPE_COLORS: Record<
  InventoryMovementType,
  "accent" | "success" | "warning" | "danger"
> = {
  opening: "success",
  purchase: "success",
  sale: "accent",
  reversal: "warning",
  adjustment: "accent",
  waste: "danger",
  damage: "danger",
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

function compareValues(a: string | number | null, b: string | number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
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
        comparison = compareValues(a.cost_per_unit, b.cost_per_unit);
        break;
      case "total_cost":
        comparison = compareValues(a.total_cost, b.total_cost);
        break;
      case "source":
        comparison = a.source.localeCompare(b.source);
        break;
      case "reason":
        comparison = compareValues(a.reason, b.reason);
        break;
      case "actor":
        comparison = compareValues(a.actor?.name ?? null, b.actor?.name ?? null);
        break;
      case "moved_at":
        comparison = Date.parse(a.moved_at) - Date.parse(b.moved_at);
        break;
    }
    return comparison === 0 ? a.id.localeCompare(b.id) : comparison * direction;
  });
}

function MovementTypeChip({ type }: { type: InventoryMovementType }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Chip color={MOVEMENT_TYPE_COLORS[type]} size="sm" variant="soft">
      <Chip.Label>{t(`movements.types.${type}` as TranslationKey)}</Chip.Label>
    </Chip>
  );
}

function MovementSourceChip({ source }: { source: string }): React.JSX.Element {
  const { t } = useTranslation();
  const normalizedSource = source.trim().toLowerCase().replace(/[_-]+/g, " ");
  const translationKey = MOVEMENT_SOURCE_TRANSLATIONS[normalizedSource];
  const label = translationKey ? t(translationKey) : normalizeInventorySource(source);

  return (
    <Chip color="default" size="sm" variant="soft">
      <Chip.Label numberOfLines={1} ellipsizeMode="tail">
        {label}
      </Chip.Label>
    </Chip>
  );
}

export default function InventoryMovementsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useNavigationTheme();
  const [themeColorMuted] = useThemeColor(["muted"]);
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
          <TableSkeleton columnWidths={[150, 220, 150, 150, 150, 150, 150, 220, 170, 180]} />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={query.refetch} />
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerClassName="w-full px-4 py-4 pb-24 md:px-6"
            refreshControl={
              <RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />
            }
          >
            <View className="flex-1 items-center w-full">
              <Table sortDescriptor={sortDescriptor} onSortChange={setSortDescriptor}>
                <Table.ScrollContainer className="w-full self-center">
                  <Table.Content className="w-full">
                    <Table.Header>
                      <Table.Column id="type" width={150} allowsSorting>
                        {t("movements.type")}
                      </Table.Column>
                      <Table.Column id="item" width={220} allowsSorting>
                        {t("movements.item")}
                      </Table.Column>
                      <Table.Column id="quantity" width={150} allowsSorting>
                        {t("movements.quantity")}
                      </Table.Column>
                      <Table.Column id="balance_after" width={150} allowsSorting>
                        {t("movements.balanceAfter")}
                      </Table.Column>
                      <Table.Column id="cost_per_unit" width={150} allowsSorting>
                        {t("movements.costPerUnit")}
                      </Table.Column>
                      <Table.Column id="total_cost" width={150} allowsSorting>
                        {t("movements.totalCost")}
                      </Table.Column>
                      <Table.Column id="source" width={150} allowsSorting>
                        {t("movements.source")}
                      </Table.Column>
                      <Table.Column id="reason" width={220} allowsSorting>
                        {t("movements.reason")}
                      </Table.Column>
                      <Table.Column id="actor" width={170} allowsSorting>
                        {t("movements.actor")}
                      </Table.Column>
                      <Table.Column id="moved_at" width={180} allowsSorting>
                        {t("movements.movedAt")}
                      </Table.Column>
                    </Table.Header>
                    <Table.Body
                      items={sortedMovements}
                      keyExtractor={(movement) => movement.id}
                      renderEmptyState={() => (
                        <EmptyState className="py-16">
                          <EmptyState.Header>
                            <EmptyState.Media variant="icon">
                              <AppIcon
                                name="stats-chart-outline"
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
                      )}
                    >
                      {(movement) => (
                        <Table.Row id={movement.id}>
                          <Table.Cell textProps={{ numberOfLines: 1 }}>
                            <MovementTypeChip type={movement.type} />
                          </Table.Cell>
                          <Table.Cell textProps={{ numberOfLines: 1 }}>
                            <Typography weight="semibold" numberOfLines={1}>
                              {getMovementItem(movement)}
                            </Typography>
                          </Table.Cell>
                          <Table.Cell textProps={{ className: "tabular-nums" }}>
                            <View className="flex-row items-center gap-2">
                              <Typography className="tabular-nums">
                                {formatSignedQuantity(movement.quantity)}
                              </Typography>
                              {movement.ingredient?.base_unit ? (
                                <Chip size="sm" color="default" variant="soft">
                                  <Chip.Label>{movement.ingredient.base_unit}</Chip.Label>
                                </Chip>
                              ) : null}
                            </View>
                          </Table.Cell>
                          <Table.Cell textProps={{ className: "tabular-nums" }}>
                            {formatInventoryQuantity(movement.balance_after)}
                          </Table.Cell>
                          <Table.Cell textProps={{ className: "tabular-nums" }}>
                            {movement.cost_per_unit === null
                              ? "—"
                              : formatRupiah(movement.cost_per_unit)}
                          </Table.Cell>
                          <Table.Cell textProps={{ className: "tabular-nums" }}>
                            {movement.total_cost === null ? "—" : formatRupiah(movement.total_cost)}
                          </Table.Cell>
                          <Table.Cell textProps={{ numberOfLines: 1 }}>
                            {movement.source ? (
                              <MovementSourceChip source={movement.source} />
                            ) : (
                              "—"
                            )}
                          </Table.Cell>
                          <Table.Cell textProps={{ numberOfLines: 1 }}>
                            {movement.reason ?? "—"}
                          </Table.Cell>
                          <Table.Cell textProps={{ numberOfLines: 1 }}>
                            {movement.actor?.name ?? "—"}
                          </Table.Cell>
                          <Table.Cell textProps={{ className: "tabular-nums" }}>
                            {formatDateTime(movement.moved_at)}
                          </Table.Cell>
                        </Table.Row>
                      )}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
                {query.hasNextPage ? (
                  <Table.Footer className="flex-row items-center justify-between gap-3">
                    <Typography type="body-xs" color="muted">
                      {t("movements.loadedCount", { count: sortedMovements.length })}
                    </Typography>
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => query.fetchNextPage()}
                      isDisabled={query.isFetchingNextPage}
                    >
                      <Button.Label>
                        {query.isFetchingNextPage
                          ? t("movements.loadingMore")
                          : t("movements.loadMore")}
                      </Button.Label>
                    </Button>
                  </Table.Footer>
                ) : null}
              </Table>
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
}
