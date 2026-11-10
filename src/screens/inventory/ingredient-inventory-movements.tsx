import MovementTable from "@/components/common/movement-table";
import RequestError from "@/components/common/request-error";
import { Typography, Spinner, Button } from "panelui-native";
import { MOVEMENT_TABLE_WIDTH } from "@/utils/inventory-movement-table";
import { useInventoryMovements } from "@/hooks/db/use-inventory-audit";
import { useTranslation } from "@/stores/use-locale";
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
        <View className="flex-1 items-center justify-center gap-3 py-20">
          <Spinner />
          <Typography type="body-sm" muted>
            {t("movements.loadingMore")}
          </Typography>
        </View>
      ) : movementsQuery.isError ? (
        <RequestError error={movementsQuery.error} onRetry={() => void movementsQuery.refetch()} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={{ width: MOVEMENT_TABLE_WIDTH }}>
            <MovementTable
              movements={movements}
              emptyTitle={t("ingredients.inventoryMovementsEmpty")}
              emptyDescription={t("ingredients.inventoryMovementsEmptyDescription")}
            />
          </View>
        </ScrollView>
      )}
      {movementsQuery.hasNextPage ? (
        <View className="flex-row items-center justify-end pt-3">
          <Button
            size="sm"
            variant="ghost"
            onPress={() => void movementsQuery.fetchNextPage()}
            disabled={movementsQuery.isFetchingNextPage}
          >
            {movementsQuery.isFetchingNextPage
              ? t("movements.loadingMore")
              : t("movements.loadMore")}
          </Button>
        </View>
      ) : null}
    </ScrollView>
  );
}
