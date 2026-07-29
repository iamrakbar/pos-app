import CartPanel from "./components/cart-panel";
import ProductGrid from "./components/product-grid";
import SearchBar from "./components/search-bar";
import FloatingCartButton, { FLOATING_CART_BUTTON_SPACE } from "./components/floating-cart-button";
import { useCartStore } from "@/stores/use-cart-store";
import { usePOSStore } from "@/stores/use-pos-store";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { POSProduct } from "@/types/pos";
import type { JSX } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Platform, StatusBar, View } from "react-native";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { paymentGroupsQueryOptions } from "@/hooks/db/use-payments";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export default function POSScreen(): JSX.Element {
  const { width: viewportWidth, isWide } = useResponsiveLayout();
  const router = useRouter();
  const beginAddonSelection = usePOSStore((s) => s.beginAddonSelection);
  const addItem = useCartStore((s) => s.addItem);
  const theme = useNavigationTheme();
  const queryClient = useQueryClient();
  const cartPanelWidth = Math.min(Math.max(Math.floor(viewportWidth * 0.34), 340), 460);

  useEffect(() => {
    void queryClient.prefetchQuery(paymentGroupsQueryOptions);
  }, [queryClient]);

  useFocusEffect(() => {
    if (Platform.OS !== "android") return;

    StatusBar.setBackgroundColor(theme.surface, true);
    return () => StatusBar.setBackgroundColor(theme.background, true);
  });

  const handleSelectProduct = (product: POSProduct) => {
    if (product.add_ons.length > 0) {
      if (beginAddonSelection(product)) {
        router.navigate("/pos/add-ons");
      }
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
    <View className="flex-1 flex-row p-safe">
      {/* Product catalog */}
      <View className="flex-1">
        <SearchBar />
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
  );
}
