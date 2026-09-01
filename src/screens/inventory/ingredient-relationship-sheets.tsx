import AppIcon from "@/components/common/app-icon";
import ErrorState from "@/components/common/error-state";
import { useIngredientSupplierOffers } from "@/hooks/db/use-supplier-offers";
import { useInventoryMovements } from "@/hooks/db/use-inventory-audit";
import type { InventoryMovementType } from "@/api/endpoints/inventory-audit";
import type { TranslationKey } from "@/locales";
import { useTranslation } from "@/stores/use-locale";
import {
  formatDateTime,
  formatInventoryQuantity,
  formatRupiah,
  normalizeInventorySource,
} from "@/utils/format";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Button, Chip, Spinner, Typography, useThemeColor } from "heroui-native";
import { EmptyState, Table } from "heroui-native-pro";
import React from "react";
import { ScrollView, View } from "react-native";

type Movement = App.Data.Merchant.Inventory.InventoryMovementData;
type SupplierOffer = App.Data.Merchant.Inventory.SupplierOfferData;

type IngredientRelationshipSheetsProps = {
  ingredientId: string;
  ingredientName: string;
  supplierOffersSheetRef: React.RefObject<TrueSheet | null>;
  movementsSheetRef: React.RefObject<TrueSheet | null>;
};

const MOVEMENT_TYPE_COLORS: Record<
  InventoryMovementType,
  "accent" | "success" | "warning" | "danger"
> = {
  opening: "success",
  purchase: "success",
  sale: "accent",
  reversal: "warning",
  adjustment: "accent",
  waste: "danger",
  damage: "danger",
  return: "warning",
};

function formatSignedQuantity(value: number): string {
  const quantity = formatInventoryQuantity(Math.abs(value));
  return value > 0 ? `+${quantity}` : value < 0 ? `-${quantity}` : quantity;
}

function SheetHeader({
  title,
  description,
  onClose,
}: {
  title: string;
  description: string;
  onClose: () => void;
}): React.JSX.Element {
  const [themeColorForeground] = useThemeColor(["foreground"]);
  const { t } = useTranslation();

  return (
    <View className="bg-surface gap-1.5 px-5 pb-4 pr-14 pt-5">
      <Typography type="h4" weight="semibold">
        {title}
      </Typography>
      <Typography type="body-sm" color="muted" numberOfLines={2}>
        {description}
      </Typography>
      <Button
        variant="ghost"
        size="sm"
        isIconOnly
        className="absolute right-3 top-3"
        onPress={onClose}
        accessibilityLabel={t("common.close")}
      >
        <AppIcon name="close-outline" size={20} color={themeColorForeground} />
      </Button>
    </View>
  );
}

function SheetLoading(): React.JSX.Element {
  return (
    <View className="items-center justify-center py-20">
      <Spinner size="sm" />
    </View>
  );
}

function SupplierOfferStatus({ offer }: { offer: SupplierOffer }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View className="flex-row flex-wrap gap-1">
      {offer.is_preferred ? (
        <Chip size="sm" color="accent" variant="soft">
          <Chip.Label>{t("ingredients.supplierOfferPreferred")}</Chip.Label>
        </Chip>
      ) : null}
      <Chip size="sm" color={offer.active ? "success" : "default"} variant="soft">
        <Chip.Label>{offer.active ? t("common.active") : t("common.inactive")}</Chip.Label>
      </Chip>
    </View>
  );
}

function SupplierOffersTable({ offers }: { offers: SupplierOffer[] }): React.JSX.Element {
  const { t } = useTranslation();
  const [themeColorMuted] = useThemeColor(["muted"]);

  return (
    <Table>
      <Table.ScrollContainer className="w-full self-center">
        <Table.Content className="w-full">
          <Table.Header>
            <Table.Column id="supplier" width={180}>
              {t("ingredients.supplierOfferSupplier")}
            </Table.Column>
            <Table.Column id="sku" width={150}>
              {t("ingredients.supplierOfferSku")}
            </Table.Column>
            <Table.Column id="purchase_unit" width={160}>
              {t("ingredients.supplierOfferPurchaseUnit")}
            </Table.Column>
            <Table.Column id="pack_quantity" width={150}>
              {t("ingredients.supplierOfferPackQuantity")}
            </Table.Column>
            <Table.Column id="minimum_order_quantity" width={160}>
              {t("ingredients.supplierOfferMinimumOrderQuantity")}
            </Table.Column>
            <Table.Column id="last_purchase_price" width={180}>
              {t("ingredients.supplierOfferLastPurchasePrice")}
            </Table.Column>
            <Table.Column id="lead_time_days" width={130}>
              {t("ingredients.supplierOfferLeadTime")}
            </Table.Column>
            <Table.Column id="status" width={180}>
              {t("suppliers.status")}
            </Table.Column>
          </Table.Header>
          <Table.Body
            items={offers}
            keyExtractor={(offer) => String(offer.id)}
            renderEmptyState={() => (
              <EmptyState className="py-16">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <AppIcon name="pricetag-outline" size={22} color={themeColorMuted} />
                  </EmptyState.Media>
                  <EmptyState.Title>{t("ingredients.supplierOffersEmpty")}</EmptyState.Title>
                  <EmptyState.Description>
                    {t("ingredients.supplierOffersEmptyDescription")}
                  </EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            )}
          >
            {(offer) => (
              <Table.Row id={String(offer.id)}>
                <Table.Cell textProps={{ numberOfLines: 1 }}>
                  <Typography weight="semibold" numberOfLines={1}>
                    {offer.supplier_name ?? "—"}
                  </Typography>
                </Table.Cell>
                <Table.Cell textProps={{ numberOfLines: 1 }}>
                  {offer.supplier_sku ?? "—"}
                </Table.Cell>
                <Table.Cell textProps={{ numberOfLines: 1 }}>{offer.purchase_unit}</Table.Cell>
                <Table.Cell textProps={{ className: "tabular-nums" }}>
                  {formatInventoryQuantity(offer.pack_quantity)}
                </Table.Cell>
                <Table.Cell textProps={{ className: "tabular-nums" }}>
                  {offer.minimum_order_quantity === null
                    ? "—"
                    : formatInventoryQuantity(offer.minimum_order_quantity)}
                </Table.Cell>
                <Table.Cell textProps={{ className: "tabular-nums" }}>
                  {offer.last_purchase_price === null
                    ? "—"
                    : formatRupiah(offer.last_purchase_price)}
                </Table.Cell>
                <Table.Cell textProps={{ className: "tabular-nums" }}>
                  {offer.lead_time_days === null
                    ? "—"
                    : t("suppliers.days", {
                        count: formatInventoryQuantity(offer.lead_time_days),
                      })}
                </Table.Cell>
                <Table.Cell>
                  <SupplierOfferStatus offer={offer} />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}

function MovementTypeChip({ type }: { type: InventoryMovementType }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Chip color={MOVEMENT_TYPE_COLORS[type]} size="sm" variant="soft">
      <Chip.Label>{t(`movements.types.${type}` as TranslationKey)}</Chip.Label>
    </Chip>
  );
}

function MovementSourceChip({ source }: { source: string }): React.JSX.Element {
  return (
    <Chip color="default" size="sm" variant="soft">
      <Chip.Label numberOfLines={1} ellipsizeMode="tail">
        {normalizeInventorySource(source)}
      </Chip.Label>
    </Chip>
  );
}

function MovementsTable({ movements }: { movements: Movement[] }): React.JSX.Element {
  const { t } = useTranslation();
  const [themeColorMuted] = useThemeColor(["muted"]);

  return (
    <Table>
      <Table.ScrollContainer className="w-full self-center">
        <Table.Content className="w-full">
          <Table.Header>
            <Table.Column id="type" width={140}>
              {t("movements.type")}
            </Table.Column>
            <Table.Column id="quantity" width={150}>
              {t("movements.quantity")}
            </Table.Column>
            <Table.Column id="balance_after" width={150}>
              {t("movements.balanceAfter")}
            </Table.Column>
            <Table.Column id="cost_per_unit" width={160}>
              {t("movements.costPerUnit")}
            </Table.Column>
            <Table.Column id="source" width={160}>
              {t("movements.source")}
            </Table.Column>
            <Table.Column id="reason" width={220}>
              {t("movements.reason")}
            </Table.Column>
            <Table.Column id="actor" width={170}>
              {t("movements.actor")}
            </Table.Column>
            <Table.Column id="moved_at" width={180}>
              {t("movements.movedAt")}
            </Table.Column>
          </Table.Header>
          <Table.Body
            items={movements}
            keyExtractor={(movement) => movement.id}
            renderEmptyState={() => (
              <EmptyState className="py-16">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <AppIcon name="swap-vertical-outline" size={22} color={themeColorMuted} />
                  </EmptyState.Media>
                  <EmptyState.Title>{t("ingredients.inventoryMovementsEmpty")}</EmptyState.Title>
                  <EmptyState.Description>
                    {t("ingredients.inventoryMovementsEmptyDescription")}
                  </EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            )}
          >
            {(movement) => (
              <Table.Row id={movement.id}>
                <Table.Cell>
                  <MovementTypeChip type={movement.type} />
                </Table.Cell>
                <Table.Cell textProps={{ className: "tabular-nums" }}>
                  {formatSignedQuantity(movement.quantity)}
                </Table.Cell>
                <Table.Cell textProps={{ className: "tabular-nums" }}>
                  {formatInventoryQuantity(movement.balance_after)}
                </Table.Cell>
                <Table.Cell textProps={{ className: "tabular-nums" }}>
                  {movement.cost_per_unit === null ? "—" : formatRupiah(movement.cost_per_unit)}
                </Table.Cell>
                <Table.Cell textProps={{ numberOfLines: 1 }}>
                  <MovementSourceChip source={movement.source} />
                </Table.Cell>
                <Table.Cell textProps={{ numberOfLines: 1 }}>{movement.reason ?? "—"}</Table.Cell>
                <Table.Cell textProps={{ numberOfLines: 1 }}>
                  {movement.actor?.name ?? "—"}
                </Table.Cell>
                <Table.Cell textProps={{ className: "tabular-nums" }}>
                  {formatDateTime(movement.moved_at)}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}

export default function IngredientRelationshipSheets({
  ingredientId,
  ingredientName,
  supplierOffersSheetRef,
  movementsSheetRef,
}: IngredientRelationshipSheetsProps): React.JSX.Element {
  const { t } = useTranslation();
  const supplierOffersQuery = useIngredientSupplierOffers(ingredientId);
  const movementsQuery = useInventoryMovements({ ingredientId });
  const offers = supplierOffersQuery.data ?? [];
  const movements = movementsQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <>
      <TrueSheet
        ref={supplierOffersSheetRef}
        detents={[0.65, 1]}
        scrollable
        grabber
        cornerRadius={24}
        maxContentWidth={1100}
        header={
          <SheetHeader
            title={t("ingredients.supplierOffers")}
            description={`${ingredientName} · ${t("ingredients.supplierOffersDescription")}`}
            onClose={() => void supplierOffersSheetRef.current?.dismiss()}
          />
        }
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-0"
          showsVerticalScrollIndicator={false}
        >
          {supplierOffersQuery.isLoading ? (
            <SheetLoading />
          ) : supplierOffersQuery.isError ? (
            <ErrorState error={supplierOffersQuery.error} onRetry={supplierOffersQuery.refetch} />
          ) : (
            <SupplierOffersTable offers={offers} />
          )}
        </ScrollView>
      </TrueSheet>

      <TrueSheet
        ref={movementsSheetRef}
        detents={[0.65, 1]}
        scrollable
        grabber
        cornerRadius={24}
        maxContentWidth={1100}
        header={
          <SheetHeader
            title={t("ingredients.inventoryMovements")}
            description={`${ingredientName} · ${t("ingredients.inventoryMovementsDescription")}`}
            onClose={() => void movementsSheetRef.current?.dismiss()}
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
            <MovementsTable movements={movements} />
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
    </>
  );
}
