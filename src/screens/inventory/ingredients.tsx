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
import { useIngredients } from "@/hooks/db/use-ingredients";
import { IngredientDetailCoordinator } from "@/screens/inventory/ingredient-detail-sheet";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { formatDateTime, formatInventoryQuantity, formatRupiah } from "@/utils/format";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

type IngredientFilter = "all" | "active" | "inactive" | "low-stock";
type Ingredient = App.Data.Merchant.Inventory.IngredientData;
type TableSortDescriptor = { column: string; direction: "ascending" | "descending" };
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
const TABLE_COLUMNS = [
  { id: "name", width: 230, label: "ingredients.name" },
  { id: "unit", width: 125, label: "ingredients.unit" },
  { id: "current_stock", width: 150, label: "ingredients.currentStock" },
  { id: "reorder_point", width: 150, label: "ingredients.reorderPoint" },
  { id: "cost_per_unit", width: 150, label: "ingredients.costPerUnit" },
  { id: "supplier", width: 220, label: "ingredients.supplier" },
  { id: "status", width: 130, label: "ingredients.status" },
  { id: "created_at", width: 180, label: "ingredients.createdAt" },
  { id: "updated_at", width: 180, label: "ingredients.updatedAt" },
] as const;
const SKELETON_COLUMN_WIDTHS = [230, 125, 150, 150, 150, 220, 130, 180, 180];
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
        comparison = compareTableValues(a.base_unit, b.base_unit);
        break;
      case "cost_per_unit":
        comparison = compareTableValues(a.cost_per_unit, b.cost_per_unit);
        break;
      case "supplier":
        comparison = compareTableValues(
          a.preferred_supplier?.name ?? null,
          b.preferred_supplier?.name ?? null
        );
        break;
      case "status":
        comparison = getStatusRank(a) - getStatusRank(b);
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
    return (
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
    );
  }

  if (query.isError) {
    return (
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
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="w-full px-4 py-4 pb-24 md:px-6"
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />}
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
                        onSortChange((previous) => ({
                          column: column.id,
                          direction:
                            previous.column === column.id && previous.direction === "ascending"
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
              {ingredients.length ? (
                <Table.Body>
                  {ingredients.map((ingredient) => (
                    <Table.Row
                      key={ingredient.id}
                      accessibilityLabel={`${t("ingredients.detailsTitle")}: ${ingredient.name}`}
                      onPress={() => onSelectIngredient(ingredient.id)}
                    >
                      <Table.Cell>
                        <PanelTypography type="body-sm" weight="semibold" numberOfLines={1}>
                          {ingredient.name}
                        </PanelTypography>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip size="sm">{ingredient.base_unit}</Chip>
                      </Table.Cell>
                      <Table.Cell labelClassName="tabular-nums">
                        {formatInventoryQuantity(ingredient.current_stock)}
                      </Table.Cell>
                      <Table.Cell labelClassName="tabular-nums">
                        {formatInventoryQuantity(ingredient.reorder_point)}
                      </Table.Cell>
                      <Table.Cell labelClassName="tabular-nums">
                        {ingredient.cost_per_unit === null
                          ? "—"
                          : formatRupiah(ingredient.cost_per_unit)}
                      </Table.Cell>
                      <Table.Cell>
                        <PanelTypography type="body-sm" numberOfLines={1}>
                          {ingredient.preferred_supplier?.name ?? "—"}
                        </PanelTypography>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          size="sm"
                          variant={
                            !ingredient.active
                              ? "destructive"
                              : isLowStock(ingredient)
                                ? "warning"
                                : "success"
                          }
                        >
                          {!ingredient.active
                            ? t("common.inactive")
                            : isLowStock(ingredient)
                              ? t("ingredients.lowStock")
                              : t("common.active")}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell labelClassName="tabular-nums">
                        {formatDateTime(ingredient.created_at, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </Table.Cell>
                      <Table.Cell labelClassName="tabular-nums">
                        {formatDateTime(ingredient.updated_at, {
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
                        <AppIcon icon={AppIcons.food} size={22} color={mutedColor} />
                      </EmptyState.Media>
                      <EmptyState.Title>{t("ingredients.empty")}</EmptyState.Title>
                      <EmptyState.Description>
                        {t("ingredients.emptyDescription")}
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
              {t("ingredients.loadedCount", { count: ingredients.length })}
            </Typography>
            <PanelButton
              size="sm"
              variant="ghost"
              onPress={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
            >
              {query.isFetchingNextPage ? t("ingredients.loadingMore") : t("ingredients.loadMore")}
            </PanelButton>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

export default function InventoryIngredientsScreen(): React.JSX.Element {
  const fabInsets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useNavigationTheme();
  const [themeColorMuted] = useCSSVariable(["--color-muted-foreground"]) as [string];
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
        <Fab
          icon={<PlusIcon size={22} />}
          placement="bottom-right"
          style={{ bottom: Math.max(fabInsets.bottom, 24), right: 24, zIndex: 50 }}
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
