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
import type { InventoryOperationStatus } from "@/api/endpoints/inventory-audit";
import type { TranslationKey } from "@/locales";
import { useInventoryOperations } from "@/hooks/db/use-inventory-audit";
import { useTranslation } from "@/stores/use-locale";
import { formatDateTime, formatInventoryQuantity, normalizeInventorySource } from "@/utils/format";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { Stack } from "expo-router";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

type Operation = App.Data.Merchant.Inventory.InventoryOperationData;
type TableSortDescriptor = { column: string; direction: "ascending" | "descending" };
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
const TABLE_COLUMNS = [
  { id: "source", width: 180, label: "operations.source" },
  { id: "status", width: 140, label: "operations.status" },
  { id: "movement_count", width: 130, label: "operations.movementCount" },
  { id: "attempts", width: 120, label: "operations.attempts" },
  { id: "actor", width: 180, label: "operations.actor" },
  { id: "failure_reason", width: 260, label: "operations.failureReason" },
  { id: "created_at", width: 180, label: "operations.createdAt" },
  { id: "processed_at", width: 180, label: "operations.processedAt" },
  { id: "failed_at", width: 180, label: "operations.failedAt" },
] as const;
const SKELETON_COLUMN_WIDTHS = [180, 140, 130, 120, 180, 260, 180, 180, 180];
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
const OPERATION_STATUS_COLORS: Record<
  InventoryOperationStatus,
  "primary" | "success" | "warning" | "destructive"
> = {
  processing: "warning",
  posted: "success",
  reversed: "primary",
  failed: "destructive",
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
        comparison = compareTableValues(a.actor?.name ?? null, b.actor?.name ?? null);
        break;
      case "failure_reason":
        comparison = compareTableValues(a.failure_reason, b.failure_reason);
        break;
      case "created_at":
        comparison = Date.parse(a.created_at) - Date.parse(b.created_at);
        break;
      case "processed_at":
        comparison = compareTableValues(
          a.processed_at ? Date.parse(a.processed_at) : null,
          b.processed_at ? Date.parse(b.processed_at) : null
        );
        break;
      case "failed_at":
        comparison = compareTableValues(
          a.failed_at ? Date.parse(a.failed_at) : null,
          b.failed_at ? Date.parse(b.failed_at) : null
        );
        break;
    }
    return comparison === 0 ? a.id.localeCompare(b.id) : comparison * direction;
  });
}

function formatOptionalDate(value: string | null): string {
  return value ? formatDateTime(value) : "—";
}

export default function InventoryOperationsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useNavigationTheme();
  const [themeColorMuted] = useCSSVariable(["--color-muted-foreground"]) as [string];
  const [status, setStatus] = React.useState<OperationFilter>("all");
  const [sortDescriptor, setSortDescriptor] = React.useState<TableSortDescriptor>({
    column: "created_at",
    direction: "descending",
  });
  const query = useInventoryOperations({
    status: status === "all" ? undefined : status,
    sort: getOperationSort(sortDescriptor),
  });
  const operations = query.data?.pages.flatMap((page) => page.data) ?? [];
  const sortedOperations = sortOperations(operations, sortDescriptor);

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
          <ScrollView className="flex-1" contentContainerClassName="w-full px-4 py-4 pb-24 md:px-6">
            <ScrollView horizontal>
              <View
                style={{ width: SKELETON_COLUMN_WIDTHS.reduce((sum, width) => sum + width, 0) }}
                accessibilityRole="progressbar"
              >
                <Table columns={SKELETON_COLUMN_WIDTHS.map((width) => ({ width }))}>
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
                </Table>
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
                  <Table columns={COLUMN_LAYOUT}>
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
                    {sortedOperations.length ? (
                      <Table.Body>
                        {sortedOperations.map((operation) => (
                          <Table.Row key={operation.id}>
                            <Table.Cell>
                              {operation.source ? (
                                <Chip size="sm">{normalizeInventorySource(operation.source)}</Chip>
                              ) : (
                                "—"
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              <Chip size="sm" variant={OPERATION_STATUS_COLORS[operation.status]}>
                                {t(`operations.statuses.${operation.status}` as TranslationKey)}
                              </Chip>
                            </Table.Cell>
                            <Table.Cell labelClassName="tabular-nums">
                              {formatInventoryQuantity(operation.movement_count)}
                            </Table.Cell>
                            <Table.Cell labelClassName="tabular-nums">
                              {formatInventoryQuantity(operation.attempts)}
                            </Table.Cell>
                            <Table.Cell>
                              <PanelTypography type="body-sm" numberOfLines={1}>
                                {operation.actor?.name ?? "—"}
                              </PanelTypography>
                            </Table.Cell>
                            <Table.Cell>
                              <PanelTypography type="body-sm" numberOfLines={1}>
                                {operation.failure_reason ?? "—"}
                              </PanelTypography>
                            </Table.Cell>
                            <Table.Cell labelClassName="tabular-nums">
                              {formatDateTime(operation.created_at)}
                            </Table.Cell>
                            <Table.Cell labelClassName="tabular-nums">
                              {formatOptionalDate(operation.processed_at)}
                            </Table.Cell>
                            <Table.Cell labelClassName="tabular-nums">
                              {formatOptionalDate(operation.failed_at)}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    ) : (
                      <Table.Empty>
                        <EmptyState className="py-16">
                          <EmptyState.Header>
                            <EmptyState.Media variant="icon">
                              <AppIcon icon={AppIcons.time} size={22} color={themeColorMuted} />
                            </EmptyState.Media>
                            <EmptyState.Title>{t("operations.empty")}</EmptyState.Title>
                            <EmptyState.Description>
                              {t("operations.emptyDescription")}
                            </EmptyState.Description>
                          </EmptyState.Header>
                        </EmptyState>
                      </Table.Empty>
                    )}
                  </Table>
                </View>
              </ScrollView>
              {query.hasNextPage ? (
                <View className="w-full flex-row items-center justify-between gap-3 p-4">
                  <Typography type="body-xs" muted>
                    {t("operations.loadedCount", { count: sortedOperations.length })}
                  </Typography>
                  <PanelButton
                    size="sm"
                    variant="ghost"
                    onPress={() => query.fetchNextPage()}
                    disabled={query.isFetchingNextPage}
                  >
                    {query.isFetchingNextPage
                      ? t("operations.loadingMore")
                      : t("operations.loadMore")}
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
