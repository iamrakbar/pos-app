import InventoryMovementsTable from "@/components/common/inventory-movements-table";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import { useInventoryMovements } from "@/hooks/db/use-inventory-audit";
import { useTranslation } from "@/stores/use-locale";
import { Button } from "heroui-native";
import React from "react";
import { ScrollView, View } from "react-native";

export default function IngredientInventoryMovementsScreen({
  ingredientId,
}: {
  ingredientId: string;
}): React.JSX.Element {
  const { t } = useTranslation();
  const movementsQuery = useInventoryMovements({ ingredientId });
  const movements = movementsQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-4 px-5 pb-safe pt-4"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {movementsQuery.isLoading ? (
        <LoadingState message={t("movements.loadingMore")} />
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
  );
}
