import CartPanel from "./components/cart-panel";
import ProductGrid from "./components/product-grid";
import SearchBar from "./components/search-bar";
import AddOnModal from "./components/modals/add-on-modal";
import FloatingCartButton, { FLOATING_CART_BUTTON_SPACE } from "./components/floating-cart-button";
import { useCartStore } from "@/stores/use-cart-store";
import { usePOSStore } from "@/stores/use-pos-store";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { POSProduct } from "@/types/pos";
import type { JSX } from "react";
import { useFocusEffect, useIsFocused } from "expo-router";
import { Platform, StatusBar, View } from "react-native";
import { useNavigationTheme } from "@/utils/navigation-theme";

export default function POSScreen(): JSX.Element {
  const { width: viewportWidth, isWide } = useResponsiveLayout();
  const openAddonModal = usePOSStore((s) => s.openAddonModal);
  const addItem = useCartStore((s) => s.addItem);
  const isFocused = useIsFocused();
  const theme = useNavigationTheme();
  const cartPanelWidth = Math.min(Math.max(Math.floor(viewportWidth * 0.34), 340), 460);

  useFocusEffect(() => {
    if (Platform.OS !== "android") return;

    StatusBar.setBackgroundColor(theme.surface, true);
    return () => StatusBar.setBackgroundColor(theme.background, true);
  });

  const handleSelectProduct = (product: POSProduct) => {
    if (product.add_ons.length > 0) {
      openAddonModal(product);
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
    <View className="flex-1 flex-row bg-surface p-safe">
      {/* Product catalog */}
      <View className="flex-1 bg-background">
        <SearchBar />
        <ProductGrid
          onSelectProduct={handleSelectProduct}
          bottomInset={isWide ? 0 : FLOATING_CART_BUTTON_SPACE}
        />
      </View>

      {isFocused ? (
        isWide ? (
          <View style={{ width: cartPanelWidth }}>
            <CartPanel />
          </View>
        ) : (
          <FloatingCartButton />
        )
      ) : null}

      {/* Modals */}
      <AddOnModal />
    </View>
  );
}
