import TableHeadings from "@/components/common/table-headings";
import RequestError from "@/components/common/request-error";
import { Table, Chip, Typography, Spinner, Fab, PlusIcon, EmptyState } from "panelui-native";
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
            <Spinner />
            <Typography type="body-sm" muted>
              {t("suppliers.loadingOne")}
            </Typography>
          </View>
        ) : supplierOffersQuery.isError ? (
          <RequestError
            error={supplierOffersQuery.error}
            onRetry={() => void supplierOffersQuery.refetch()}
          />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View className="w-supplier-offers-table">
              <Table columns={[180, 150, 160, 150, 160, 180, 130, 180].map((width) => ({ width }))}>
                <TableHeadings
                  columns={[
                    "ingredients.supplierOfferSupplier",
                    "ingredients.supplierOfferSku",
                    "ingredients.supplierOfferPurchaseUnit",
                    "ingredients.supplierOfferPackQuantity",
                    "ingredients.supplierOfferMinimumOrderQuantity",
                    "ingredients.supplierOfferLastPurchasePrice",
                    "ingredients.supplierOfferLeadTime",
                    "suppliers.status",
                  ]}
                />
                {offers.length ? (
                  <Table.Body>
                    {offers.map((offer) => (
                      <Table.Row key={offer.id} onPress={() => showOfferForm(offer)}>
                        <Table.Cell>
                          <Typography weight="semibold" numberOfLines={1}>
                            {offer.supplier_name ?? "—"}
                          </Typography>
                        </Table.Cell>
                        <Table.Cell>
                          <Typography numberOfLines={1}>{offer.supplier_sku ?? "—"}</Typography>
                        </Table.Cell>
                        <Table.Cell>
                          <Typography numberOfLines={1}>{offer.purchase_unit}</Typography>
                        </Table.Cell>
                        <Table.Cell labelClassName="tabular-nums">
                          {formatInventoryQuantity(offer.pack_quantity)}
                        </Table.Cell>
                        <Table.Cell labelClassName="tabular-nums">
                          {offer.minimum_order_quantity === null
                            ? "—"
                            : formatInventoryQuantity(offer.minimum_order_quantity)}
                        </Table.Cell>
                        <Table.Cell labelClassName="tabular-nums">
                          {offer.last_purchase_price === null
                            ? "—"
                            : formatRupiah(offer.last_purchase_price)}
                        </Table.Cell>
                        <Table.Cell labelClassName="tabular-nums">
                          {offer.lead_time_days === null
                            ? "—"
                            : t("suppliers.days", {
                                count: formatInventoryQuantity(offer.lead_time_days),
                              })}
                        </Table.Cell>
                        <Table.Cell>
                          <View className="flex-row flex-wrap gap-1">
                            {offer.is_preferred ? (
                              <Chip size="sm" variant="primary">
                                {t("ingredients.supplierOfferPreferred")}
                              </Chip>
                            ) : null}
                            <Chip size="sm" variant={offer.active ? "success" : "default"}>
                              {offer.active ? t("common.active") : t("common.inactive")}
                            </Chip>
                          </View>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                ) : (
                  <Table.Empty>
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
                  </Table.Empty>
                )}
              </Table>
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
