import {
  Button as PanelButton,
  Typography,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  Chip,
  EmptyState,
  Fab,
  PlusIcon,
  Table,
  Typography as PanelTypography,
  Skeleton as PanelTableSkeleton,
} from "panelui-native";
import { getErrorMessage } from "@/api/api-error";
import { compareTableValues } from "@/utils/table-sort";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useSuppliers } from "@/hooks/db/use-suppliers";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { formatDateTime, formatInventoryQuantity } from "@/utils/format";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

type Supplier = App.Data.Merchant.Inventory.SupplierData;
type TableSortDescriptor = { column: string; direction: "ascending" | "descending" };
type SupplierFilter = "all" | "active" | "inactive";
type SupplierSortColumn =
  | "name"
  | "contact_name"
  | "email"
  | "phone"
  | "lead_time_days"
  | "payment_terms"
  | "active_offer_count"
  | "status"
  | "created_at"
  | "updated_at";
type ServerSortColumn = "name" | "created_at";

const SORTABLE_COLUMNS = new Set<SupplierSortColumn>([
  "name",
  "contact_name",
  "email",
  "phone",
  "lead_time_days",
  "payment_terms",
  "active_offer_count",
  "status",
  "created_at",
  "updated_at",
]);
const SERVER_SORT_COLUMNS = new Set<ServerSortColumn>(["name", "created_at"]);
const TABLE_COLUMNS = [
  { id: "name", width: 180, label: "suppliers.name" },
  { id: "contact_name", width: 170, label: "suppliers.contactName" },
  { id: "email", width: 240, label: "suppliers.email" },
  { id: "phone", width: 160, label: "suppliers.phone" },
  { id: "lead_time_days", width: 140, label: "suppliers.leadTime" },
  { id: "payment_terms", width: 180, label: "suppliers.paymentTerms" },
  { id: "active_offer_count", width: 130, label: "suppliers.activeOffers" },
  { id: "status", width: 130, label: "suppliers.status" },
  { id: "created_at", width: 180, label: "suppliers.createdAt" },
  { id: "updated_at", width: 180, label: "suppliers.updatedAt" },
] as const;
const SKELETON_COLUMN_WIDTHS = [180, 170, 240, 160, 140, 180, 130, 130, 180, 180, 140];
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

function getSupplierSort(
  descriptor: TableSortDescriptor
): "name" | "-name" | "created_at" | "-created_at" {
  const column = String(descriptor.column);
  if (!SERVER_SORT_COLUMNS.has(column as ServerSortColumn)) return "name";
  const descending = descriptor.direction === "descending";
  if (column === "created_at") return descending ? "-created_at" : "created_at";
  return descending ? "-name" : "name";
}

function getSortColumn(descriptor: TableSortDescriptor): SupplierSortColumn {
  const column = String(descriptor.column) as SupplierSortColumn;
  return SORTABLE_COLUMNS.has(column) ? column : "name";
}

function sortSuppliers(items: Supplier[], descriptor: TableSortDescriptor): Supplier[] {
  const column = getSortColumn(descriptor);
  if (SERVER_SORT_COLUMNS.has(column as ServerSortColumn)) return items;

  const direction = descriptor.direction === "descending" ? -1 : 1;
  return [...items].sort((a, b) => {
    let comparison: number;
    switch (column) {
      case "contact_name":
        comparison = compareTableValues(a.contact_name, b.contact_name);
        break;
      case "email":
        comparison = compareTableValues(a.email, b.email);
        break;
      case "phone":
        comparison = compareTableValues(a.phone, b.phone);
        break;
      case "lead_time_days":
        comparison = compareTableValues(a.lead_time_days, b.lead_time_days);
        break;
      case "payment_terms":
        comparison = compareTableValues(a.payment_terms, b.payment_terms);
        break;
      case "active_offer_count":
        comparison = compareTableValues(a.active_offer_count, b.active_offer_count);
        break;
      case "status":
        comparison = Number(a.active) - Number(b.active);
        break;
      case "updated_at":
        comparison = compareTableValues(Date.parse(a.updated_at), Date.parse(b.updated_at));
        break;
      default:
        comparison = 0;
    }
    return comparison === 0 ? a.name.localeCompare(b.name) : comparison * direction;
  });
}

export default function InventorySuppliersScreen(): React.JSX.Element {
  const fabInsets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useNavigationTheme();
  const [themeColorMuted] = useCSSVariable(["--color-muted-foreground"]) as [string];
  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search.trim());
  const [filter, setFilter] = React.useState<SupplierFilter>("all");
  const [sortDescriptor, setSortDescriptor] = React.useState<TableSortDescriptor>({
    column: "name",
    direction: "ascending",
  });
  const query = useSuppliers({
    search: deferredSearch || undefined,
    active: filter === "all" ? undefined : filter === "active",
    sort: getSupplierSort(sortDescriptor),
  });
  const suppliers = query.data?.pages.flatMap((page) => page.data) ?? [];
  const sortedSuppliers = sortSuppliers(suppliers, sortDescriptor);

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.SearchBar
          placement="integratedCentered"
          placeholder={t("suppliers.search")}
          barTintColor={theme.surface}
          tintColor={theme.foreground}
          textColor={theme.foreground}
          hintTextColor={theme.muted}
          headerIconColor={theme.foreground}
          onChangeText={(event) => setSearch(event.nativeEvent.text)}
          onClose={() => setSearch("")}
        />
        <Stack.Toolbar.Menu
          {...getToolbarIcon("filter")}
          tintColor={theme.foreground}
          accessibilityLabel={t("suppliers.filterAccessibility")}
        >
          <Stack.Toolbar.Label>{t("common.filter")}</Stack.Toolbar.Label>
          {(["all", "active", "inactive"] as const).map((value) => (
            <Stack.Toolbar.MenuAction
              key={value}
              onPress={() => setFilter(value)}
              isOn={filter === value}
            >
              {value === "all"
                ? t("common.all")
                : value === "active"
                  ? t("common.active")
                  : t("common.inactive")}
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
                    {sortedSuppliers.length ? (
                      <Table.Body>
                        {sortedSuppliers.map((supplier) => (
                          <Table.Row
                            key={supplier.id}
                            accessibilityLabel={t("suppliers.editAccessibility", {
                              supplier: supplier.name,
                            })}
                            onPress={() =>
                              router.push(`/settings/inventory/suppliers/${supplier.id}`)
                            }
                          >
                            <Table.Cell>
                              <PanelTypography type="body-sm" weight="semibold" numberOfLines={1}>
                                {supplier.name}
                              </PanelTypography>
                            </Table.Cell>
                            <Table.Cell>
                              <PanelTypography type="body-sm" numberOfLines={1}>
                                {supplier.contact_name ?? "—"}
                              </PanelTypography>
                            </Table.Cell>
                            <Table.Cell>
                              <PanelTypography type="body-sm" numberOfLines={1}>
                                {supplier.email ?? "—"}
                              </PanelTypography>
                            </Table.Cell>
                            <Table.Cell>{supplier.phone ?? "—"}</Table.Cell>
                            <Table.Cell labelClassName="tabular-nums">
                              {supplier.lead_time_days === null
                                ? "—"
                                : t("suppliers.days", {
                                    count: formatInventoryQuantity(supplier.lead_time_days),
                                  })}
                            </Table.Cell>
                            <Table.Cell>{supplier.payment_terms ?? "—"}</Table.Cell>
                            <Table.Cell labelClassName="tabular-nums">
                              {formatInventoryQuantity(supplier.active_offer_count)}
                            </Table.Cell>
                            <Table.Cell>
                              <Chip size="sm" variant={supplier.active ? "success" : "destructive"}>
                                {supplier.active ? t("common.active") : t("common.inactive")}
                              </Chip>
                            </Table.Cell>
                            <Table.Cell labelClassName="tabular-nums">
                              {formatDateTime(supplier.created_at, {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </Table.Cell>
                            <Table.Cell labelClassName="tabular-nums">
                              {formatDateTime(supplier.updated_at, {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    ) : (
                      <Table.Empty>
                        <EmptyState className="py-16">
                          <EmptyState.Header>
                            <EmptyState.Media variant="icon">
                              <AppIcon
                                icon={AppIcons.storefront}
                                size={22}
                                color={themeColorMuted}
                              />
                            </EmptyState.Media>
                            <EmptyState.Title>{t("suppliers.empty")}</EmptyState.Title>
                            <EmptyState.Description>
                              {t("suppliers.emptyDescription")}
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
                    {t("suppliers.loadedCount", { count: sortedSuppliers.length })}
                  </Typography>
                  <PanelButton
                    size="sm"
                    variant="ghost"
                    onPress={() => query.fetchNextPage()}
                    disabled={query.isFetchingNextPage}
                  >
                    {query.isFetchingNextPage
                      ? t("suppliers.loadingMore")
                      : t("suppliers.loadMore")}
                  </PanelButton>
                </View>
              ) : null}
            </View>
          </ScrollView>
        )}
        <Fab
          icon={<PlusIcon size={22} />}
          placement="bottom-right"
          style={{ bottom: Math.max(fabInsets.bottom, 24), right: 24, zIndex: 50 }}
          accessibilityLabel={t("suppliers.addAccessibility")}
          onPress={() => router.push("/settings/inventory/suppliers/new")}
        />
      </View>
    </>
  );
}
