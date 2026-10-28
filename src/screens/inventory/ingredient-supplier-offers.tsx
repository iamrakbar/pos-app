import {
  Table as PanelTable,
  Chip as PanelChip,
  Typography as PanelText,
  Spinner as PanelLoadingSpinner,
  Typography as PanelLoadingText,
  Fab,
  PlusIcon,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  EmptyState,
} from "panelui-native";
import { getErrorMessage } from "@/api/api-error";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useIngredientSupplierOffers } from "@/hooks/db/use-supplier-offers";
import { useTranslation } from "@/stores/use-locale";
import { formatInventoryQuantity, formatRupiah } from "@/utils/format";
import React from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";

type SupplierOffer = App.Data.Merchant.Inventory.SupplierOfferData;

export default function IngredientSupplierOffersScreen({
  ingredientId,
}: {
  ingredientId: string;
}): React.JSX.Element {
  const fabInsets = useSafeAreaInsets();
  const { t } = useTranslation();
  const themeColorMuted = useCSSVariable("--color-muted-foreground") as string;
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
          <View className="flex-1 items-center justify-center gap-3 py-20">
            <PanelLoadingSpinner />
            <PanelLoadingText type="body-sm" muted>
              {t("suppliers.loadingOne")}
            </PanelLoadingText>
          </View>
        ) : supplierOffersQuery.isError ? (
          <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
            <PanelErrorAlert variant="destructive">
              <PanelErrorAlert.Indicator />
              <PanelErrorAlert.Content>
                <PanelErrorAlert.Description>
                  {getErrorMessage(supplierOffersQuery.error)}
                </PanelErrorAlert.Description>
              </PanelErrorAlert.Content>
            </PanelErrorAlert>
            <PanelErrorButton variant="outline" onPress={() => void supplierOffersQuery.refetch()}>
              {t("common.retry")}
            </PanelErrorButton>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={{ width: 1290 }}>
              <PanelTable
                columns={[180, 150, 160, 150, 160, 180, 130, 180].map((width) => ({ width }))}
              >
                <PanelTable.Header>
                  <PanelTable.Row>
                    <PanelTable.Head>{t("ingredients.supplierOfferSupplier")}</PanelTable.Head>
                    <PanelTable.Head>{t("ingredients.supplierOfferSku")}</PanelTable.Head>
                    <PanelTable.Head>{t("ingredients.supplierOfferPurchaseUnit")}</PanelTable.Head>
                    <PanelTable.Head>{t("ingredients.supplierOfferPackQuantity")}</PanelTable.Head>
                    <PanelTable.Head>
                      {t("ingredients.supplierOfferMinimumOrderQuantity")}
                    </PanelTable.Head>
                    <PanelTable.Head>
                      {t("ingredients.supplierOfferLastPurchasePrice")}
                    </PanelTable.Head>
                    <PanelTable.Head>{t("ingredients.supplierOfferLeadTime")}</PanelTable.Head>
                    <PanelTable.Head>{t("suppliers.status")}</PanelTable.Head>
                  </PanelTable.Row>
                </PanelTable.Header>
                {offers.length ? (
                  <PanelTable.Body>
                    {offers.map((offer) => (
                      <PanelTable.Row key={offer.id} onPress={() => showOfferForm(offer)}>
                        <PanelTable.Cell>
                          <PanelText weight="semibold" numberOfLines={1}>
                            {offer.supplier_name ?? "—"}
                          </PanelText>
                        </PanelTable.Cell>
                        <PanelTable.Cell>
                          <PanelText numberOfLines={1}>{offer.supplier_sku ?? "—"}</PanelText>
                        </PanelTable.Cell>
                        <PanelTable.Cell>
                          <PanelText numberOfLines={1}>{offer.purchase_unit}</PanelText>
                        </PanelTable.Cell>
                        <PanelTable.Cell labelClassName="tabular-nums">
                          {formatInventoryQuantity(offer.pack_quantity)}
                        </PanelTable.Cell>
                        <PanelTable.Cell labelClassName="tabular-nums">
                          {offer.minimum_order_quantity === null
                            ? "—"
                            : formatInventoryQuantity(offer.minimum_order_quantity)}
                        </PanelTable.Cell>
                        <PanelTable.Cell labelClassName="tabular-nums">
                          {offer.last_purchase_price === null
                            ? "—"
                            : formatRupiah(offer.last_purchase_price)}
                        </PanelTable.Cell>
                        <PanelTable.Cell labelClassName="tabular-nums">
                          {offer.lead_time_days === null
                            ? "—"
                            : t("suppliers.days", {
                                count: formatInventoryQuantity(offer.lead_time_days),
                              })}
                        </PanelTable.Cell>
                        <PanelTable.Cell>
                          <View className="flex-row flex-wrap gap-1">
                            {offer.is_preferred ? (
                              <PanelChip size="sm" variant="primary">
                                {t("ingredients.supplierOfferPreferred")}
                              </PanelChip>
                            ) : null}
                            <PanelChip size="sm" variant={offer.active ? "success" : "default"}>
                              {offer.active ? t("common.active") : t("common.inactive")}
                            </PanelChip>
                          </View>
                        </PanelTable.Cell>
                      </PanelTable.Row>
                    ))}
                  </PanelTable.Body>
                ) : (
                  <PanelTable.Empty>
                    <EmptyState className="py-16">
                      <EmptyState.Header>
                        <EmptyState.Media variant="icon">
                          <AppIcon icon={AppIcons.priceTag} size={22} color={themeColorMuted} />
                        </EmptyState.Media>
                        <EmptyState.Title>{t("ingredients.supplierOffersEmpty")}</EmptyState.Title>
                        <EmptyState.Description>
                          {t("ingredients.supplierOffersEmptyDescription")}
                        </EmptyState.Description>
                      </EmptyState.Header>
                    </EmptyState>
                  </PanelTable.Empty>
                )}
              </PanelTable>
            </View>
          </ScrollView>
        )}
      </ScrollView>
      <Fab
        icon={<PlusIcon size={22} />}
        placement="bottom-right"
        style={{ bottom: Math.max(fabInsets.bottom, 24), right: 24, zIndex: 50 }}
        accessibilityLabel={t("ingredients.addSupplierOffer")}
        onPress={() => showOfferForm(null)}
      />
    </View>
  );
}
