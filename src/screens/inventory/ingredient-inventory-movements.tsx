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
import { Chip, EmptyState, Table, Typography, Spinner, Alert, Button } from "panelui-native";
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
          <Spinner />
          <Typography type="body-sm" muted>
            {t("movements.loadingMore")}
          </Typography>
        </View>
      ) : movementsQuery.isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
          <Alert variant="destructive">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{getErrorMessage(movementsQuery.error)}</Alert.Description>
            </Alert.Content>
          </Alert>
          <Button variant="outline" onPress={() => void movementsQuery.refetch()}>
            {t("common.retry")}
          </Button>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={{ width: MOVEMENT_TABLE_WIDTH }}>
            <Table columns={MOVEMENT_TABLE_COLUMNS}>
              <Table.Header>
                <Table.Row>
                  <Table.Head>{t("movements.type")}</Table.Head>
                  <Table.Head>{t("movements.quantity")}</Table.Head>
                  <Table.Head>{t("movements.balanceAfter")}</Table.Head>
                  <Table.Head>{t("movements.costPerUnit")}</Table.Head>
                  <Table.Head>{t("movements.source")}</Table.Head>
                  <Table.Head>{t("movements.reason")}</Table.Head>
                  <Table.Head>{t("movements.actor")}</Table.Head>
                  <Table.Head>{t("movements.movedAt")}</Table.Head>
                </Table.Row>
              </Table.Header>
              {movements.length ? (
                <Table.Body>
                  {movements.map((movement) => (
                    <Table.Row key={movement.id}>
                      <Table.Cell>
                        <Chip variant={MOVEMENT_TYPE_COLORS[movement.type]} size="sm">
                          {t(`movements.types.${movement.type}` as TranslationKey)}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell labelClassName="tabular-nums">
                        {formatSignedQuantity(movement.quantity)}
                      </Table.Cell>
                      <Table.Cell labelClassName="tabular-nums">
                        {formatInventoryQuantity(movement.balance_after)}
                      </Table.Cell>
                      <Table.Cell labelClassName="tabular-nums">
                        {movement.cost_per_unit === null
                          ? "—"
                          : formatRupiah(movement.cost_per_unit)}
                      </Table.Cell>
                      <Table.Cell>
                        <Chip variant="default" size="sm">
                          <Typography type="body-xs" numberOfLines={1}>
                            {normalizeInventorySource(movement.source)}
                          </Typography>
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <Typography type="body-sm" numberOfLines={1}>
                          {movement.reason ?? "—"}
                        </Typography>
                      </Table.Cell>
                      <Table.Cell>
                        <Typography type="body-sm" numberOfLines={1}>
                          {movement.actor?.name ?? "—"}
                        </Typography>
                      </Table.Cell>
                      <Table.Cell labelClassName="tabular-nums">
                        {formatDateTime(movement.moved_at)}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              ) : (
                <Table.Empty>
                  <EmptyState className="py-16">
                    <EmptyState.Header>
                      <EmptyState.Media variant="icon">
                        <AppIcon icon={AppIcons.swapVertical} size={22} color={themeColorMuted} />
                      </EmptyState.Media>
                      <EmptyState.Title>
                        {t("ingredients.inventoryMovementsEmpty")}
                      </EmptyState.Title>
                      <EmptyState.Description>
                        {t("ingredients.inventoryMovementsEmptyDescription")}
                      </EmptyState.Description>
                    </EmptyState.Header>
                  </EmptyState>
                </Table.Empty>
              )}
            </Table>
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
