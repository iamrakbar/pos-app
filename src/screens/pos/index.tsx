import CartPanel from "@/components/pos/CartPanel";
import ProductGrid from "@/components/pos/ProductGrid";
import SearchBar from "@/components/pos/SearchBar";
import AddOnModal from "@/components/pos/modals/AddOnModal";
import { useCartStore } from "@/stores/useCartStore";
import { usePOSStore } from "@/stores/usePOSStore";
import type { POSProduct } from "@/types/pos";
import type { JSX } from "react";
import { useCallback } from "react";
import { View } from "react-native";

const CART_PANEL_WIDTH = 400;

export default function POSScreen(): JSX.Element {
  const openAddonModal = usePOSStore((s) => s.openAddonModal);
  const addItem = useCartStore((s) => s.addItem);

  const handleSelectProduct = useCallback((product: POSProduct) => {
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
  }, [addItem, openAddonModal]);

  return (
    <View className="flex-1 flex-row p-safe">
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
    </View>
  );
}
