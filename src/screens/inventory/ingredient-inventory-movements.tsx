import { useCSSVariable } from "uniwind";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import type { TranslationKey } from "@/locales";
import {
  formatDateTime,
  formatInventoryQuantity,
  formatRupiah,
  normalizeInventorySource,
} from "@/utils/format";
import {
  Chip as PanelMovementChip,
  EmptyState as PanelMovementEmpty,
  Table as PanelMovementTable,
  Typography as PanelMovementText,

  Spinner as PanelLoadingSpinner,
  Typography as PanelLoadingText,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton} from "panelui-native";
import {
  MOVEMENT_TYPE_COLORS,
  MOVEMENT_TABLE_COLUMNS,
  MOVEMENT_TABLE_WIDTH,
  formatSignedQuantity,
} from "@/utils/inventory-movement-table";
import { getErrorMessage } from "@/api/api-error";
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
  const themeColorMuted = useCSSVariable("--color-muted-foreground") as string;
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
          <PanelLoadingSpinner />
          <PanelLoadingText type="body-sm" muted>
            {t("movements.loadingMore")}
          </PanelLoadingText>
        </View>
      ) : movementsQuery.isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
          <PanelErrorAlert variant="destructive">
            <PanelErrorAlert.Indicator />
            <PanelErrorAlert.Content>
              <PanelErrorAlert.Description>
                {getErrorMessage(movementsQuery.error)}
              </PanelErrorAlert.Description>
            </PanelErrorAlert.Content>
          </PanelErrorAlert>
          <PanelErrorButton variant="outline" onPress={() => void movementsQuery.refetch()}>
            {t("common.retry")}
          </PanelErrorButton>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={{ width: MOVEMENT_TABLE_WIDTH }}>
            <PanelMovementTable columns={MOVEMENT_TABLE_COLUMNS}>
              <PanelMovementTable.Header>
                <PanelMovementTable.Row>
                  <PanelMovementTable.Head>{t("movements.type")}</PanelMovementTable.Head>
                  <PanelMovementTable.Head>{t("movements.quantity")}</PanelMovementTable.Head>
                  <PanelMovementTable.Head>{t("movements.balanceAfter")}</PanelMovementTable.Head>
                  <PanelMovementTable.Head>{t("movements.costPerUnit")}</PanelMovementTable.Head>
                  <PanelMovementTable.Head>{t("movements.source")}</PanelMovementTable.Head>
                  <PanelMovementTable.Head>{t("movements.reason")}</PanelMovementTable.Head>
                  <PanelMovementTable.Head>{t("movements.actor")}</PanelMovementTable.Head>
                  <PanelMovementTable.Head>{t("movements.movedAt")}</PanelMovementTable.Head>
                </PanelMovementTable.Row>
              </PanelMovementTable.Header>
              {movements.length ? (
                <PanelMovementTable.Body>
                  {movements.map((movement) => (
                    <PanelMovementTable.Row key={movement.id}>
                      <PanelMovementTable.Cell>
                        <PanelMovementChip variant={MOVEMENT_TYPE_COLORS[movement.type]} size="sm">
                          {t(`movements.types.${movement.type}` as TranslationKey)}
                        </PanelMovementChip>
                      </PanelMovementTable.Cell>
                      <PanelMovementTable.Cell labelClassName="tabular-nums">
                        {formatSignedQuantity(movement.quantity)}
                      </PanelMovementTable.Cell>
                      <PanelMovementTable.Cell labelClassName="tabular-nums">
                        {formatInventoryQuantity(movement.balance_after)}
                      </PanelMovementTable.Cell>
                      <PanelMovementTable.Cell labelClassName="tabular-nums">
                        {movement.cost_per_unit === null
                          ? "—"
                          : formatRupiah(movement.cost_per_unit)}
                      </PanelMovementTable.Cell>
                      <PanelMovementTable.Cell>
                        <PanelMovementChip variant="default" size="sm">
                          <PanelMovementText type="body-xs" numberOfLines={1}>
                            {normalizeInventorySource(movement.source)}
                          </PanelMovementText>
                        </PanelMovementChip>
                      </PanelMovementTable.Cell>
                      <PanelMovementTable.Cell>
                        <PanelMovementText type="body-sm" numberOfLines={1}>
                          {movement.reason ?? "—"}
                        </PanelMovementText>
                      </PanelMovementTable.Cell>
                      <PanelMovementTable.Cell>
                        <PanelMovementText type="body-sm" numberOfLines={1}>
                          {movement.actor?.name ?? "—"}
                        </PanelMovementText>
                      </PanelMovementTable.Cell>
                      <PanelMovementTable.Cell labelClassName="tabular-nums">
                        {formatDateTime(movement.moved_at)}
                      </PanelMovementTable.Cell>
                    </PanelMovementTable.Row>
                  ))}
                </PanelMovementTable.Body>
              ) : (
                <PanelMovementTable.Empty>
                  <PanelMovementEmpty className="py-16">
                    <PanelMovementEmpty.Header>
                      <PanelMovementEmpty.Media variant="icon">
                        <AppIcon icon={AppIcons.swapVertical} size={22} color={themeColorMuted} />
                      </PanelMovementEmpty.Media>
                      <PanelMovementEmpty.Title>
                        {t("ingredients.inventoryMovementsEmpty")}
                      </PanelMovementEmpty.Title>
                      <PanelMovementEmpty.Description>
                        {t("ingredients.inventoryMovementsEmptyDescription")}
                      </PanelMovementEmpty.Description>
                    </PanelMovementEmpty.Header>
                  </PanelMovementEmpty>
                </PanelMovementTable.Empty>
              )}
            </PanelMovementTable>
          </View>
        </ScrollView>
      )}
      {movementsQuery.hasNextPage ? (
        <View className="flex-row items-center justify-end pt-3">
          <PanelErrorButton
            size="sm"
            variant="ghost"
            onPress={() => void movementsQuery.fetchNextPage()}
            disabled={movementsQuery.isFetchingNextPage}
          >
            {movementsQuery.isFetchingNextPage
              ? t("movements.loadingMore")
              : t("movements.loadMore")}
          </PanelErrorButton>
        </View>
      ) : null}
    </ScrollView>
  );
}
