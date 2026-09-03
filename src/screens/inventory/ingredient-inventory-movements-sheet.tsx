import InventoryMovementsTable from "@/components/common/inventory-movements-table";
import ErrorState from "@/components/common/error-state";
import { useInventoryMovements } from "@/hooks/db/use-inventory-audit";
import { useTranslation } from "@/stores/use-locale";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Button } from "heroui-native";
import React from "react";
import { ScrollView, View } from "react-native";
import {
  SheetHeader,
  SheetLoading,
} from "@/screens/inventory/ingredient-relationship-sheet-shared";

export default function IngredientInventoryMovementsSheet({
  ingredientId,
  ingredientName,
  sheetRef,
}: {
  ingredientId: string;
  ingredientName: string;
  sheetRef: React.RefObject<TrueSheet | null>;
}): React.JSX.Element {
  const { t } = useTranslation();
  const movementsQuery = useInventoryMovements({ ingredientId });
  const movements = movementsQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <TrueSheet
      ref={sheetRef}
      detents={[0.65, 1]}
      scrollable
      grabber
      cornerRadius={24}
      maxContentWidth={1100}
      header={
        <SheetHeader
          title={t("ingredients.inventoryMovements")}
          description={`${ingredientName} · ${t("ingredients.inventoryMovementsDescription")}`}
          onClose={() => void sheetRef.current?.dismiss()}
        />
      }
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-0"
        showsVerticalScrollIndicator={false}
      >
        {movementsQuery.isLoading ? (
          <SheetLoading />
        ) : movementsQuery.isError ? (
          <ErrorState error={movementsQuery.error} onRetry={movementsQuery.refetch} />
        ) : (
          <InventoryMovementsTable
            movements={movements}
            emptyTitle={t("ingredients.inventoryMovementsEmpty")}
            emptyDescription={t("ingredients.inventoryMovementsEmptyDescription")}
          />
        )}
        {movementsQuery.hasNextPage ? (
          <View className="flex-row items-center justify-end pt-3">
            <Button
              size="sm"
              variant="ghost"
              onPress={() => void movementsQuery.fetchNextPage()}
              isDisabled={movementsQuery.isFetchingNextPage}
            >
              <Button.Label>
                {movementsQuery.isFetchingNextPage
                  ? t("movements.loadingMore")
                  : t("movements.loadMore")}
              </Button.Label>
            </Button>
          </View>
        ) : null}
      </ScrollView>
    </TrueSheet>
  );
}
