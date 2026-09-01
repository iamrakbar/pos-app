import AppIcon from "@/components/common/app-icon";
import ErrorState from "@/components/common/error-state";
import TableSkeleton from "@/components/common/table-skeleton";
import type { InventoryOperationStatus } from "@/api/endpoints/inventory-audit";
import type { TranslationKey } from "@/locales";
import { useInventoryOperations } from "@/hooks/db/use-inventory-audit";
import { useTranslation } from "@/stores/use-locale";
import { formatDateTime, formatInventoryQuantity, normalizeInventorySource } from "@/utils/format";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { Stack } from "expo-router";
import { Button, Chip, Typography, useThemeColor } from "heroui-native";
import { EmptyState, Table, type TableSortDescriptor } from "heroui-native-pro";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

type Operation = App.Data.Merchant.Inventory.InventoryOperationData;
type OperationFilter = "all" | InventoryOperationStatus;
type OperationSortColumn =
  | "source"
  | "status"
  | "movement_count"
  | "attempts"
  | "actor"
  | "failure_reason"
  | "created_at"
  | "processed_at"
  | "failed_at";

const OPERATION_STATUSES: readonly OperationFilter[] = [
  "all",
  "processing",
  "posted",
  "reversed",
  "failed",
];
const SORTABLE_COLUMNS = new Set<OperationSortColumn>([
  "source",
  "status",
  "movement_count",
  "attempts",
  "actor",
  "failure_reason",
  "created_at",
  "processed_at",
  "failed_at",
]);
const SERVER_SORT_COLUMNS = new Set(["created_at"]);
const OPERATION_STATUS_COLORS: Record<
  InventoryOperationStatus,
  "accent" | "success" | "warning" | "danger"
> = {
  processing: "warning",
  posted: "success",
  reversed: "accent",
  failed: "danger",
};

function getSortColumn(descriptor: TableSortDescriptor): OperationSortColumn {
  const column = String(descriptor.column) as OperationSortColumn;
  return SORTABLE_COLUMNS.has(column) ? column : "created_at";
}

function getOperationSort(descriptor: TableSortDescriptor): "created_at" | "-created_at" {
  const column = String(descriptor.column);
  if (!SERVER_SORT_COLUMNS.has(column)) return "-created_at";
  return descriptor.direction === "descending" ? "-created_at" : "created_at";
}

function compareValues(a: string | number | null, b: string | number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

function sortOperations(items: Operation[], descriptor: TableSortDescriptor): Operation[] {
  const column = getSortColumn(descriptor);
  const direction = descriptor.direction === "descending" ? -1 : 1;
  return [...items].sort((a, b) => {
    let comparison: number;
    switch (column) {
      case "source":
        comparison = a.source.localeCompare(b.source);
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "movement_count":
        comparison = a.movement_count - b.movement_count;
        break;
      case "attempts":
        comparison = a.attempts - b.attempts;
        break;
      case "actor":
        comparison = compareValues(a.actor?.name ?? null, b.actor?.name ?? null);
        break;
      case "failure_reason":
        comparison = compareValues(a.failure_reason, b.failure_reason);
        break;
      case "created_at":
        comparison = Date.parse(a.created_at) - Date.parse(b.created_at);
        break;
      case "processed_at":
        comparison = compareValues(
          a.processed_at ? Date.parse(a.processed_at) : null,
          b.processed_at ? Date.parse(b.processed_at) : null
        );
        break;
      case "failed_at":
        comparison = compareValues(
          a.failed_at ? Date.parse(a.failed_at) : null,
          b.failed_at ? Date.parse(b.failed_at) : null
        );
        break;
    }
    return comparison === 0 ? a.id.localeCompare(b.id) : comparison * direction;
  });
}

function OperationStatusChip({ status }: { status: InventoryOperationStatus }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Chip color={OPERATION_STATUS_COLORS[status]} size="sm">
      <Chip.Label>{t(`operations.statuses.${status}` as TranslationKey)}</Chip.Label>
    </Chip>
  );
}

function formatOptionalDate(value: string | null): string {
  return value ? formatDateTime(value) : "—";
}

export default function InventoryOperationsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useNavigationTheme();
  const [themeColorMuted] = useThemeColor(["muted"]);
  const [status, setStatus] = React.useState<OperationFilter>("all");
  const [sortDescriptor, setSortDescriptor] = React.useState<TableSortDescriptor>({
    column: "created_at",
    direction: "descending",
  });
  const query = useInventoryOperations({
    status: status === "all" ? undefined : status,
    sort: getOperationSort(sortDescriptor),
  });
  const operations = React.useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data]
  );
  const sortedOperations = React.useMemo(
    () => sortOperations(operations, sortDescriptor),
    [operations, sortDescriptor]
  );

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu
          {...getToolbarIcon("filter")}
          tintColor={theme.foreground}
          accessibilityLabel={t("operations.filterAccessibility")}
        >
          <Stack.Toolbar.Label>{t("common.filter")}</Stack.Toolbar.Label>
          {OPERATION_STATUSES.map((value) => (
            <Stack.Toolbar.MenuAction
              key={value}
              onPress={() => setStatus(value)}
              isOn={status === value}
            >
              {value === "all"
                ? t("common.all")
                : t(`operations.statuses.${value}` as TranslationKey)}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <View className="flex-1 bg-background">
        {query.isLoading ? (
          <TableSkeleton columnWidths={[180, 140, 130, 120, 180, 260, 180, 180, 180]} />
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
                      <Table.Column id="source" width={180} allowsSorting>
                        {t("operations.source")}
                      </Table.Column>
                      <Table.Column id="status" width={140} allowsSorting>
                        {t("operations.status")}
                      </Table.Column>
                      <Table.Column id="movement_count" width={130} allowsSorting>
                        {t("operations.movementCount")}
                      </Table.Column>
                      <Table.Column id="attempts" width={120} allowsSorting>
                        {t("operations.attempts")}
                      </Table.Column>
                      <Table.Column id="actor" width={180} allowsSorting>
                        {t("operations.actor")}
                      </Table.Column>
                      <Table.Column id="failure_reason" width={260} allowsSorting>
                        {t("operations.failureReason")}
                      </Table.Column>
                      <Table.Column id="created_at" width={180} allowsSorting>
                        {t("operations.createdAt")}
                      </Table.Column>
                      <Table.Column id="processed_at" width={180} allowsSorting>
                        {t("operations.processedAt")}
                      </Table.Column>
                      <Table.Column id="failed_at" width={180} allowsSorting>
                        {t("operations.failedAt")}
                      </Table.Column>
                    </Table.Header>
                    <Table.Body
                      items={sortedOperations}
                      keyExtractor={(operation) => operation.id}
                      renderEmptyState={() => (
                        <EmptyState className="py-16">
                          <EmptyState.Header>
                            <EmptyState.Media variant="icon">
                              <AppIcon name="time-outline" size={22} color={themeColorMuted} />
                            </EmptyState.Media>
                            <EmptyState.Title>{t("operations.empty")}</EmptyState.Title>
                            <EmptyState.Description>
                              {t("operations.emptyDescription")}
                            </EmptyState.Description>
                          </EmptyState.Header>
                        </EmptyState>
                      )}
                    >
                      {(operation) => (
                        <Table.Row id={operation.id}>
                          <Table.Cell textProps={{ numberOfLines: 1 }}>
                            {operation.source ? (
                              <Chip color="default" size="sm">
                                <Chip.Label numberOfLines={1} ellipsizeMode="tail">
                                  {normalizeInventorySource(operation.source)}
                                </Chip.Label>
                              </Chip>
                            ) : (
                              "—"
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            <OperationStatusChip status={operation.status} />
                          </Table.Cell>
                          <Table.Cell textProps={{ className: "tabular-nums" }}>
                            {formatInventoryQuantity(operation.movement_count)}
                          </Table.Cell>
                          <Table.Cell textProps={{ className: "tabular-nums" }}>
                            {formatInventoryQuantity(operation.attempts)}
                          </Table.Cell>
                          <Table.Cell textProps={{ numberOfLines: 1 }}>
                            {operation.actor?.name ?? "—"}
                          </Table.Cell>
                          <Table.Cell textProps={{ numberOfLines: 1 }}>
                            {operation.failure_reason ?? "—"}
                          </Table.Cell>
                          <Table.Cell textProps={{ className: "tabular-nums" }}>
                            {formatDateTime(operation.created_at)}
                          </Table.Cell>
                          <Table.Cell textProps={{ className: "tabular-nums" }}>
                            {formatOptionalDate(operation.processed_at)}
                          </Table.Cell>
                          <Table.Cell textProps={{ className: "tabular-nums" }}>
                            {formatOptionalDate(operation.failed_at)}
                          </Table.Cell>
                        </Table.Row>
                      )}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
                {query.hasNextPage ? (
                  <Table.Footer className="flex-row items-center justify-between gap-3">
                    <Typography type="body-xs" color="muted">
                      {t("operations.loadedCount", { count: sortedOperations.length })}
                    </Typography>
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => query.fetchNextPage()}
                      isDisabled={query.isFetchingNextPage}
                    >
                      <Button.Label>
                        {query.isFetchingNextPage
                          ? t("operations.loadingMore")
                          : t("operations.loadMore")}
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
