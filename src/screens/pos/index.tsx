import CartPanel from "@/components/pos/CartPanel";
import ProductGrid from "@/components/pos/ProductGrid";
import SearchBar from "@/components/pos/SearchBar";
import AddOnModal from "@/components/pos/modals/AddOnModal";
import CheckoutModal from "@/components/pos/modals/CheckoutModal";
import PaymentModal from "@/components/pos/modals/PaymentModal";
import { useCartStore } from "@/stores/useCartStore";
import { usePOSStore } from "@/stores/usePOSStore";
import type { POSProduct } from "@/types/pos";
import type { JSX } from "react";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Platform, StatusBar, View } from "react-native";
import { useNavigationTheme } from "@/utils/navigationTheme";

const CART_PANEL_WIDTH = 400;

export default function POSScreen(): JSX.Element {
  const openAddonModal = usePOSStore((s) => s.openAddonModal);
  const addItem = useCartStore((s) => s.addItem);
  const theme = useNavigationTheme();

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
        <ProductGrid onSelectProduct={handleSelectProduct} />
      </View>

      {/* Cart panel */}
      <View style={{ width: CART_PANEL_WIDTH }}>
        <CartPanel />
      </View>

      {/* Modals */}
      <AddOnModal />
      <CheckoutModal />
      <PaymentModal />
    </View>
  );
}
