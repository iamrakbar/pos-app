import AppIcon from "@/components/common/app-icon";
import ErrorState from "@/components/common/error-state";
import CreateFAB from "@/components/common/create-fab";
import { useIngredientSupplierOffers } from "@/hooks/db/use-supplier-offers";
import { useTranslation } from "@/stores/use-locale";
import { formatInventoryQuantity, formatRupiah } from "@/utils/format";
import { Chip, Typography, useThemeColor } from "heroui-native";
import { EmptyState, Table } from "heroui-native-pro";
import React from "react";
import { ScrollView, View } from "react-native";
import LoadingState from "@/components/common/loading-state";
import { useRouter } from "expo-router";

type SupplierOffer = App.Data.Merchant.Inventory.SupplierOfferData;

export default function IngredientSupplierOffersScreen({
  ingredientId,
}: {
  ingredientId: string;
}): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const supplierOffersQuery = useIngredientSupplierOffers(ingredientId);
  const offers = supplierOffersQuery.data ?? [];

  const showOfferForm = (offer: SupplierOffer | null) => {
    router.push(
      offer
        ? `/settings/inventory/ingredients/${ingredientId}/supplier-offers/${offer.id}`
        : `/settings/inventory/ingredients/${ingredientId}/supplier-offers/new`
    );
  };

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pb-safe pt-4"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {supplierOffersQuery.isLoading ? (
          <LoadingState message={t("suppliers.loadingOne")} />
        ) : supplierOffersQuery.isError ? (
          <ErrorState error={supplierOffersQuery.error} onRetry={supplierOffersQuery.refetch} />
        ) : (
          <SupplierOffersTable offers={offers} onEdit={showOfferForm} />
        )}
      </ScrollView>
      <CreateFAB
        accessibilityLabel={t("ingredients.addSupplierOffer")}
        onPress={() => showOfferForm(null)}
      />
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

function SupplierOffersTable({
  offers,
  onEdit,
}: {
  offers: SupplierOffer[];
  onEdit: (offer: SupplierOffer) => void;
}): React.JSX.Element {
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
              <Table.Row id={String(offer.id)} onPress={() => onEdit(offer)}>
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
