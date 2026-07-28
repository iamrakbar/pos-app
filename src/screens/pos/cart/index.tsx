import CartContent from "@/screens/pos/components/cart-content";
import CheckoutModal from "@/screens/pos/components/modals/checkout-modal";
import PaymentModal from "@/screens/pos/components/modals/payment-modal";
import type { JSX } from "react";
import { View } from "react-native";

export default function CartScreen(): JSX.Element {
  return (
    <View className="flex-1 bg-surface">
      <CartContent />
      <CheckoutModal />
      <PaymentModal />
    </View>
  );
}
