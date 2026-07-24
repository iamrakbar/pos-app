import CartPanel from "./components/cart-panel";
import ProductGrid from "./components/product-grid";
import SearchBar from "./components/search-bar";
import AddOnModal from "./components/modals/add-on-modal";
import CheckoutModal from "./components/modals/checkout-modal";
import PaymentModal from "./components/modals/payment-modal";
import { useCartStore } from "@/stores/useCartStore";
import { usePOSStore } from "@/stores/usePOSStore";
import type { POSProduct } from "@/types/pos";
import type { JSX } from "react";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Platform, StatusBar, View, useWindowDimensions } from "react-native";
import { useNavigationTheme } from "@/utils/navigationTheme";

export default function POSScreen(): JSX.Element {
  const { width: viewportWidth } = useWindowDimensions();
  const openAddonModal = usePOSStore((s) => s.openAddonModal);
  const addItem = useCartStore((s) => s.addItem);
  const theme = useNavigationTheme();
  const cartPanelWidth = Math.floor(viewportWidth / 3);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;

      StatusBar.setBackgroundColor(theme.surface, true);
      return () => StatusBar.setBackgroundColor(theme.background, true);
    }, [theme.background, theme.surface])
  );

  const handleSelectProduct = useCallback(
    (product: POSProduct) => {
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
    },
    [addItem, openAddonModal]
  );

  return (
    <View className="flex-1 flex-row bg-surface p-safe">
      {/* Product catalog */}
      <View className="flex-1 bg-background">
        <SearchBar />
        <ProductGrid onSelectProduct={handleSelectProduct} cartPanelWidth={cartPanelWidth} />
      </View>

      {/* Cart panel */}
      <View style={{ width: cartPanelWidth }}>
        <CartPanel />
      </View>

      {/* Modals */}
      <AddOnModal />
      <CheckoutModal />
      <PaymentModal />
    </View>
  );
}
