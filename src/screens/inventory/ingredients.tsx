import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import CreateFAB from "@/components/common/create-fab";
import ErrorState from "@/components/common/error-state";
import TableSkeleton from "@/components/common/table-skeleton";
import { useIngredients } from "@/hooks/db/use-ingredients";
import { IngredientDetailCoordinator } from "@/screens/inventory/ingredient-detail-sheet";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { formatDateTime, formatInventoryQuantity, formatRupiah } from "@/utils/format";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { Stack, useRouter } from "expo-router";
import { Button, Chip, Typography, useThemeColor } from "heroui-native";
import { EmptyState, Table, type TableSortDescriptor } from "heroui-native-pro";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

type IngredientFilter = "all" | "active" | "inactive" | "low-stock";
type Ingredient = App.Data.Merchant.Inventory.IngredientData;
type IngredientSortColumn =
  | "name"
  | "unit"
  | "current_stock"
  | "reorder_point"
  | "cost_per_unit"
  | "supplier"
  | "status"
  | "created_at"
  | "updated_at";
type ServerSortColumn = "name" | "current_stock" | "reorder_point" | "created_at";

const SORTABLE_COLUMNS = new Set<IngredientSortColumn>([
  "name",
  "unit",
  "current_stock",
  "reorder_point",
  "cost_per_unit",
  "supplier",
  "status",
  "created_at",
  "updated_at",
]);
const SERVER_SORT_COLUMNS = new Set<ServerSortColumn>([
  "name",
  "current_stock",
  "reorder_point",
  "created_at",
]);

function getIngredientSort(
  descriptor: TableSortDescriptor
):
  | "name"
  | "-name"
  | "current_stock"
  | "-current_stock"
  | "reorder_point"
  | "-reorder_point"
  | "created_at"
  | "-created_at" {
  const column = String(descriptor.column);
  if (!SORTABLE_COLUMNS.has(column as IngredientSortColumn)) return "name";
  if (!SERVER_SORT_COLUMNS.has(column as ServerSortColumn)) return "name";

  const descending = descriptor.direction === "descending";
  if (column === "name") return descending ? "-name" : "name";
  if (column === "current_stock") return descending ? "-current_stock" : "current_stock";
  if (column === "reorder_point") return descending ? "-reorder_point" : "reorder_point";
  if (column === "created_at") return descending ? "-created_at" : "created_at";
  return "name";
}

function getSortColumn(descriptor: TableSortDescriptor): IngredientSortColumn {
  const column = String(descriptor.column) as IngredientSortColumn;
  return SORTABLE_COLUMNS.has(column) ? column : "name";
}

function isLowStock(ingredient: Ingredient): boolean {
  return ingredient.reorder_point > 0 && ingredient.current_stock <= ingredient.reorder_point;
}

function compareValues(a: string | number | null, b: string | number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

function getStatusRank(ingredient: Ingredient): number {
  if (!ingredient.active) return 0;
  return isLowStock(ingredient) ? 1 : 2;
}

function sortIngredients(items: Ingredient[], descriptor: TableSortDescriptor): Ingredient[] {
  const column = getSortColumn(descriptor);
  if (SERVER_SORT_COLUMNS.has(column as ServerSortColumn)) return items;

  const direction = descriptor.direction === "descending" ? -1 : 1;
  return [...items].sort((a, b) => {
    let comparison: number;
    switch (column) {
      case "unit":
        comparison = compareValues(a.base_unit, b.base_unit);
        break;
      case "cost_per_unit":
        comparison = compareValues(a.cost_per_unit, b.cost_per_unit);
        break;
      case "supplier":
        comparison = compareValues(
          a.preferred_supplier?.name ?? null,
          b.preferred_supplier?.name ?? null
        );
        break;
      case "status":
        comparison = getStatusRank(a) - getStatusRank(b);
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

function IngredientStatus({ ingredient }: { ingredient: Ingredient }): React.JSX.Element {
  const { t } = useTranslation();
  const isLowStock =
    ingredient.reorder_point > 0 && ingredient.current_stock <= ingredient.reorder_point;
  const status = !ingredient.active ? "inactive" : isLowStock ? "lowStock" : "active";
  const statusPresentation = (
    {
      active: "success",
      lowStock: "warning",
      inactive: "danger",
    } as const
  )[status];

  return (
    <Chip color={statusPresentation} size="sm" variant="soft">
      <Chip.Label>
        {status === "inactive"
          ? t("common.inactive")
          : status === "lowStock"
            ? t("ingredients.lowStock")
            : t("common.active")}
      </Chip.Label>
    </Chip>
  );
}

function IngredientsTable({
  query,
  ingredients,
  sortDescriptor,
  onSortChange,
  onSelectIngredient,
  mutedColor,
}: {
  query: ReturnType<typeof useIngredients>;
  ingredients: Ingredient[];
  sortDescriptor: TableSortDescriptor;
  onSortChange: React.Dispatch<React.SetStateAction<TableSortDescriptor>>;
  onSelectIngredient: (id: string) => void;
  mutedColor: string;
}): React.JSX.Element {
  const { t } = useTranslation();

  if (query.isLoading) {
    return <TableSkeleton columnWidths={[230, 125, 150, 150, 150, 220, 130, 180, 180]} />;
  }

  if (query.isError) {
    return <ErrorState error={query.error} onRetry={query.refetch} />;
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="w-full px-4 py-4 pb-24 md:px-6"
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />}
    >
      <View className="flex-1 items-center w-full">
        <Table sortDescriptor={sortDescriptor} onSortChange={onSortChange}>
          <Table.ScrollContainer className="w-full self-center">
            <Table.Content className="w-full">
              <Table.Header>
                <Table.Column id="name" width={230} allowsSorting>
                  {t("ingredients.name")}
                </Table.Column>
                <Table.Column id="unit" width={125} allowsSorting>
                  {t("ingredients.unit")}
                </Table.Column>
                <Table.Column id="current_stock" width={150} allowsSorting>
                  {t("ingredients.currentStock")}
                </Table.Column>
                <Table.Column id="reorder_point" width={150} allowsSorting>
                  {t("ingredients.reorderPoint")}
                </Table.Column>
                <Table.Column id="cost_per_unit" width={150} allowsSorting>
                  {t("ingredients.costPerUnit")}
                </Table.Column>
                <Table.Column id="supplier" width={220} allowsSorting>
                  {t("ingredients.supplier")}
                </Table.Column>
                <Table.Column id="status" width={130} allowsSorting>
                  {t("ingredients.status")}
                </Table.Column>
                <Table.Column id="created_at" width={180} allowsSorting>
                  {t("ingredients.createdAt")}
                </Table.Column>
                <Table.Column id="updated_at" width={180} allowsSorting>
                  {t("ingredients.updatedAt")}
                </Table.Column>
              </Table.Header>
              <Table.Body
                items={ingredients}
                keyExtractor={(ingredient) => ingredient.id}
                renderEmptyState={() => (
                  <EmptyState className="py-16">
                    <EmptyState.Header>
                      <EmptyState.Media variant="icon">
                        <AppIcon icon={AppIcons.food} size={22} color={mutedColor} />
                      </EmptyState.Media>
                      <EmptyState.Title>{t("ingredients.empty")}</EmptyState.Title>
                      <EmptyState.Description>
                        {t("ingredients.emptyDescription")}
                      </EmptyState.Description>
                    </EmptyState.Header>
                  </EmptyState>
                )}
              >
                {(ingredient) => (
                  <Table.Row
                    id={ingredient.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${t("ingredients.detailsTitle")}: ${ingredient.name}`}
                    onPress={() => onSelectIngredient(ingredient.id)}
                  >
                    <Table.Cell textProps={{ numberOfLines: 1 }}>
                      <Typography weight="semibold" numberOfLines={1}>
                        {ingredient.name}
                      </Typography>
                    </Table.Cell>
                    <Table.Cell>
                      <Chip size="sm" variant="soft" color="default">
                        <Chip.Label>{ingredient.base_unit}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                    <Table.Cell textProps={{ className: "tabular-nums" }}>
                      {formatInventoryQuantity(ingredient.current_stock)}
                    </Table.Cell>
                    <Table.Cell textProps={{ className: "tabular-nums" }}>
                      {formatInventoryQuantity(ingredient.reorder_point)}
                    </Table.Cell>
                    <Table.Cell textProps={{ className: "tabular-nums" }}>
                      {ingredient.cost_per_unit === null
                        ? "—"
                        : formatRupiah(ingredient.cost_per_unit)}
                    </Table.Cell>
                    <Table.Cell textProps={{ numberOfLines: 1 }}>
                      {ingredient.preferred_supplier?.name ?? "—"}
                    </Table.Cell>
                    <Table.Cell>
                      <IngredientStatus ingredient={ingredient} />
                    </Table.Cell>
                    <Table.Cell textProps={{ className: "tabular-nums" }}>
                      {formatDateTime(ingredient.created_at, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Table.Cell>
                    <Table.Cell textProps={{ className: "tabular-nums" }}>
                      {formatDateTime(ingredient.updated_at, {
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
                {t("ingredients.loadedCount", { count: ingredients.length })}
              </Typography>
              <Button
                size="sm"
                variant="ghost"
                onPress={() => query.fetchNextPage()}
                isDisabled={query.isFetchingNextPage}
              >
                <Button.Label>
                  {query.isFetchingNextPage
                    ? t("ingredients.loadingMore")
                    : t("ingredients.loadMore")}
                </Button.Label>
              </Button>
            </Table.Footer>
          ) : null}
        </Table>
      </View>
    </ScrollView>
  );
}

export default function InventoryIngredientsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useNavigationTheme();
  const [themeColorMuted] = useThemeColor(["muted"]);
  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search.trim());
  const [filter, setFilter] = React.useState<IngredientFilter>("all");
  const [selectedIngredientId, setSelectedIngredientId] = React.useState<string | null>(null);
  const [detailOpenRequest, setDetailOpenRequest] = React.useState(0);
  const [sortDescriptor, setSortDescriptor] = React.useState<TableSortDescriptor>({
    column: "name",
    direction: "ascending",
  });
  const query = useIngredients({
    search: deferredSearch || undefined,
    active: filter === "all" || filter === "low-stock" ? undefined : filter === "active",
    lowStock: filter === "low-stock" ? true : undefined,
    sort: getIngredientSort(sortDescriptor),
  });
  const ingredients = query.data?.pages.flatMap((page) => page.data) ?? [];
  const sortedIngredients = sortIngredients(ingredients, sortDescriptor);
  const selectedIngredient = selectedIngredientId
    ? (ingredients.find((item) => item.id === selectedIngredientId) ?? null)
    : null;

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.SearchBar
          placement="integratedCentered"
          placeholder={t("ingredients.search")}
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
          accessibilityLabel={t("ingredients.filterAccessibility")}
        >
          <Stack.Toolbar.Label>{t("common.filter")}</Stack.Toolbar.Label>
          {(["all", "active", "inactive", "low-stock"] as const).map((value) => (
            <Stack.Toolbar.MenuAction
              key={value}
              onPress={() => setFilter(value)}
              isOn={filter === value}
            >
              {value === "all"
                ? t("common.all")
                : value === "active"
                  ? t("common.active")
                  : value === "inactive"
                    ? t("common.inactive")
                    : t("ingredients.lowStock")}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <View className="flex-1 bg-background">
        <IngredientsTable
          query={query}
          ingredients={sortedIngredients}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
          mutedColor={themeColorMuted}
          onSelectIngredient={(ingredientId) => {
            setSelectedIngredientId(ingredientId);
            setDetailOpenRequest((request) => request + 1);
          }}
        />
        <CreateFAB
          accessibilityLabel={t("ingredients.addAccessibility")}
          onPress={() => router.push("/settings/inventory/ingredients/new")}
        />
      </View>
      <IngredientDetailCoordinator
        ingredient={selectedIngredient}
        openRequest={detailOpenRequest}
      />
    </>
  );
}
