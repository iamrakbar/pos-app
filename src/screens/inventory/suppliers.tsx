import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import CreateFAB from "@/components/common/create-fab";
import ErrorState from "@/components/common/error-state";
import TableSkeleton from "@/components/common/table-skeleton";
import { useSuppliers } from "@/hooks/db/use-suppliers";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { formatDateTime, formatInventoryQuantity } from "@/utils/format";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { Stack, useRouter } from "expo-router";
import { Button, Chip, Typography, useThemeColor } from "heroui-native";
import { EmptyState, Table, type TableSortDescriptor } from "heroui-native-pro";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

type Supplier = App.Data.Merchant.Inventory.SupplierData;
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

function compareValues(a: string | number | null, b: string | number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

function sortSuppliers(items: Supplier[], descriptor: TableSortDescriptor): Supplier[] {
  const column = getSortColumn(descriptor);
  if (SERVER_SORT_COLUMNS.has(column as ServerSortColumn)) return items;

  const direction = descriptor.direction === "descending" ? -1 : 1;
  return [...items].sort((a, b) => {
    let comparison: number;
    switch (column) {
      case "contact_name":
        comparison = compareValues(a.contact_name, b.contact_name);
        break;
      case "email":
        comparison = compareValues(a.email, b.email);
        break;
      case "phone":
        comparison = compareValues(a.phone, b.phone);
        break;
      case "lead_time_days":
        comparison = compareValues(a.lead_time_days, b.lead_time_days);
        break;
      case "payment_terms":
        comparison = compareValues(a.payment_terms, b.payment_terms);
        break;
      case "active_offer_count":
        comparison = compareValues(a.active_offer_count, b.active_offer_count);
        break;
      case "status":
        comparison = Number(a.active) - Number(b.active);
        break;
      case "updated_at":
        comparison = compareValues(Date.parse(a.updated_at), Date.parse(b.updated_at));
        break;
      default:
        comparison = 0;
    }
    return comparison === 0 ? a.name.localeCompare(b.name) : comparison * direction;
  });
}

function SupplierStatus({ active }: { active: boolean }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Chip color={active ? "success" : "danger"} size="sm" variant="soft">
      <Chip.Label>{active ? t("common.active") : t("common.inactive")}</Chip.Label>
    </Chip>
  );
}

export default function InventorySuppliersScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useNavigationTheme();
  const [themeColorMuted] = useThemeColor(["muted"]);
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
          <TableSkeleton columnWidths={[180, 170, 240, 160, 140, 180, 130, 130, 180, 180, 140]} />
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
                      <Table.Column id="name" width={180} allowsSorting>
                        {t("suppliers.name")}
                      </Table.Column>
                      <Table.Column id="contact_name" width={170} allowsSorting>
                        {t("suppliers.contactName")}
                      </Table.Column>
                      <Table.Column id="email" width={240} allowsSorting>
                        {t("suppliers.email")}
                      </Table.Column>
                      <Table.Column id="phone" width={160} allowsSorting>
                        {t("suppliers.phone")}
                      </Table.Column>
                      <Table.Column id="lead_time_days" width={140} allowsSorting>
                        {t("suppliers.leadTime")}
                      </Table.Column>
                      <Table.Column id="payment_terms" width={180} allowsSorting>
                        {t("suppliers.paymentTerms")}
                      </Table.Column>
                      <Table.Column id="active_offer_count" width={130} allowsSorting>
                        {t("suppliers.activeOffers")}
                      </Table.Column>
                      <Table.Column id="status" width={130} allowsSorting>
                        {t("suppliers.status")}
                      </Table.Column>
                      <Table.Column id="created_at" width={180} allowsSorting>
                        {t("suppliers.createdAt")}
                      </Table.Column>
                      <Table.Column id="updated_at" width={180} allowsSorting>
                        {t("suppliers.updatedAt")}
                      </Table.Column>
                    </Table.Header>
                    <Table.Body
                      items={sortedSuppliers}
                      keyExtractor={(supplier) => supplier.id}
                      renderEmptyState={() => (
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
                      )}
                    >
                      {(supplier) => (
                        <Table.Row
                          id={supplier.id}
                          accessibilityRole="button"
                          accessibilityLabel={t("suppliers.editAccessibility", {
                            supplier: supplier.name,
                          })}
                          onPress={() =>
                            router.push(`/settings/inventory/suppliers/${supplier.id}`)
                          }
                        >
                          <Table.Cell textProps={{ numberOfLines: 1 }}>
                            <Typography weight="semibold" numberOfLines={1}>
                              {supplier.name}
                            </Typography>
                          </Table.Cell>
                          <Table.Cell textProps={{ numberOfLines: 1 }}>
                            {supplier.contact_name ?? "—"}
                          </Table.Cell>
                          <Table.Cell textProps={{ numberOfLines: 1 }}>
                            {supplier.email ?? "—"}
                          </Table.Cell>
                          <Table.Cell>{supplier.phone ?? "—"}</Table.Cell>
                          <Table.Cell textProps={{ className: "tabular-nums" }}>
                            {supplier.lead_time_days === null
                              ? "—"
                              : t("suppliers.days", {
                                  count: formatInventoryQuantity(supplier.lead_time_days),
                                })}
                          </Table.Cell>
                          <Table.Cell>{supplier.payment_terms ?? "—"}</Table.Cell>
                          <Table.Cell textProps={{ className: "tabular-nums" }}>
                            {formatInventoryQuantity(supplier.active_offer_count)}
                          </Table.Cell>
                          <Table.Cell>
                            <SupplierStatus active={supplier.active} />
                          </Table.Cell>
                          <Table.Cell textProps={{ className: "tabular-nums" }}>
                            {formatDateTime(supplier.created_at, {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </Table.Cell>
                          <Table.Cell textProps={{ className: "tabular-nums" }}>
                            {formatDateTime(supplier.updated_at, {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </Table.Cell>
                        </Table.Row>
                      )}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
                {query.hasNextPage ? (
                  <Table.Footer className="flex-row items-center justify-between gap-3">
                    <Typography type="body-xs" color="muted">
                      {t("suppliers.loadedCount", { count: sortedSuppliers.length })}
                    </Typography>
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => query.fetchNextPage()}
                      isDisabled={query.isFetchingNextPage}
                    >
                      <Button.Label>
                        {query.isFetchingNextPage
                          ? t("suppliers.loadingMore")
                          : t("suppliers.loadMore")}
                      </Button.Label>
                    </Button>
                  </Table.Footer>
                ) : null}
              </Table>
            </View>
          </ScrollView>
        )}
        <CreateFAB
          accessibilityLabel={t("suppliers.addAccessibility")}
          onPress={() => router.push("/settings/inventory/suppliers/new")}
        />
      </View>
    </>
  );
}
