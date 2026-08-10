import CartPanel from "./components/cart-panel";
import ProductGrid from "./components/product-grid";
import SearchBar from "./components/search-bar";
import FloatingCartButton, { FLOATING_CART_BUTTON_SPACE } from "./components/floating-cart-button";
import { useCartStore } from "@/stores/use-cart-store";
import { usePOSAddOnSheet } from "@/hooks/use-pos-add-on-sheet";
import { useCategories } from "@/hooks/db/use-categories";
import { useProducts } from "@/hooks/db/use-products";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { POSProduct } from "@/types/pos";
import type { JSX } from "react";
import { useFocusEffect } from "expo-router";
import { Platform, StatusBar, View } from "react-native";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { paymentGroupsQueryOptions } from "@/hooks/db/use-payments";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "@/stores/use-locale";
import { useAuth } from "@/stores/use-auth";

export default function POSScreen(): JSX.Element {
  const { t } = useTranslation();
  const { width: viewportWidth, isWide } = useResponsiveLayout();
  const openAddOnSheet = usePOSAddOnSheet();
  const addItem = useCartStore((s) => s.addItem);
  const productsQuery = useProducts();
  const categoriesQuery = useCategories();
  const isCatalogLoading = productsQuery.isLoading || categoriesQuery.isLoading;
  const theme = useNavigationTheme();
  const queryClient = useQueryClient();
  const merchantId = useAuth((state) => state.merchantId);
  const cartPanelWidth = Math.min(Math.max(Math.floor(viewportWidth * 0.34), 340), 460);

  useEffect(() => {
    if (merchantId) void queryClient.prefetchQuery(paymentGroupsQueryOptions(merchantId));
  }, [merchantId, queryClient]);

  useFocusEffect(() => {
    if (Platform.OS !== "android") return;

    StatusBar.setBackgroundColor(theme.surface, true);
    return () => StatusBar.setBackgroundColor(theme.background, true);
  });

  const handleSelectProduct = (product: POSProduct) => {
    if (product.add_ons.length > 0) {
      void openAddOnSheet(product);
    } else {
      addItem({
        product_id: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        notes: null,
        add_ons: [],
      });
    }
  };

  return (
    <View className="flex-1">
      <View
        className="flex-1 flex-row p-safe"
        pointerEvents={isCatalogLoading ? "none" : "auto"}
        accessibilityElementsHidden={isCatalogLoading}
        importantForAccessibility={isCatalogLoading ? "no-hide-descendants" : "auto"}
      >
        {/* Product catalog */}
        <View className="flex-1">
          <SearchBar isLoading={isCatalogLoading} />
          <ProductGrid
            onSelectProduct={handleSelectProduct}
            bottomInset={isWide ? 0 : FLOATING_CART_BUTTON_SPACE}
          />
        </View>

        {isWide ? (
          <View style={{ width: cartPanelWidth }}>
            <CartPanel />
          </View>
        ) : (
          <FloatingCartButton />
        )}
      </View>
      {isCatalogLoading ? (
        <View
          className="absolute inset-0"
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t("pos.loadingProducts")}
          accessibilityState={{ busy: true, disabled: true }}
        />
      ) : null}
    </View>
  );
}
