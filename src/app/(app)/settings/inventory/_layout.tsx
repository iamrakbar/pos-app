import { useNavigationTheme } from "@/utils/navigation-theme";
import { Redirect, Stack, usePathname } from "expo-router";
import { useTranslation } from "@/stores/use-locale";
import { useAuth } from "@/stores/use-auth";
import { useMerchantProfile } from "@/hooks/db/use-merchant-profile";
import { hasMerchantFeature } from "@/utils/merchant-features";

export default function InventoryLayout(): React.JSX.Element {
  const theme = useNavigationTheme();
  const { t } = useTranslation();
  const pathname = usePathname();
  const activeMerchant = useAuth((state) => state.activeMerchant);
  const { data: merchantProfile } = useMerchantProfile();
  const features = merchantProfile?.features ?? activeMerchant?.features;
  const inventoryEnabled = hasMerchantFeature(features, "inventory");
  const inventoryRecipeEnabled = hasMerchantFeature(features, "inventory_recipe");
  const isRecipeInventoryRoute =
    pathname.includes("/ingredients") || pathname.includes("/suppliers");

  if (!inventoryEnabled) return <Redirect href="/settings" />;
  if (!inventoryRecipeEnabled && isRecipeInventoryRoute) {
    return <Redirect href="/settings/inventory" />;
  }

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "",
        headerStyle: { backgroundColor: theme.background },
        headerShadowVisible: false,
        headerTintColor: theme.foreground,
        headerTitleStyle: { color: theme.foreground },
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t("navigation.inventoryOverview"),
        }}
      />
      <Stack.Screen name="ingredients" options={{ title: t("navigation.ingredients") }} />
      <Stack.Screen name="ingredients/[id]" options={{ title: t("ingredients.editTitle") }} />
      <Stack.Screen
        name="ingredients/[id]/supplier-offers/index"
        options={{ title: t("ingredients.supplierOffers") }}
      />
      <Stack.Screen
        name="ingredients/[id]/supplier-offers/new"
        options={{ title: t("ingredients.addSupplierOffer") }}
      />
      <Stack.Screen
        name="ingredients/[id]/supplier-offers/[offerId]"
        options={{ title: t("ingredients.editSupplierOffer") }}
      />
      <Stack.Screen
        name="ingredients/[id]/movements"
        options={{ title: t("ingredients.inventoryMovements") }}
      />
      <Stack.Screen name="suppliers" options={{ title: t("navigation.suppliers") }} />
      <Stack.Screen name="suppliers/[id]" options={{ title: t("suppliers.editTitle") }} />
      <Stack.Screen name="movements" options={{ title: t("navigation.movements") }} />
      <Stack.Screen name="operations" options={{ title: t("navigation.operations") }} />
    </Stack>
  );
}
