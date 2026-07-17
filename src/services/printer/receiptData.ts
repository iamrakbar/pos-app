import {
  extractNumber,
  extractOrderItems,
  extractPaymentName,
  extractStatusLabel,
  extractTableName,
} from "@/api/mappers/order";
import type { ReceiptPreviewData } from "@/components/receipt/ReceiptPaper";
import type { ReceiptOrder } from "./escpos";

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function dateLabel(value: string): string {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toReceiptData(order: ReceiptOrder): ReceiptPreviewData {
  const root = record(order) ?? {};
  const pricing = record(root.pricing);
  const rawPricingFees = Array.isArray(pricing?.fees) ? pricing.fees : [];
  const explicitTax = record(root.tax);
  const taxFee = rawPricingFees.find((fee) => {
    const value = record(fee);
    return value?.type === "tax" || /tax|pajak/i.test(String(value?.name ?? ""));
  });
  const taxRecord = explicitTax ?? record(taxFee);
  const taxAmount = extractNumber(taxRecord?.amount);
  const taxIsEnabled =
    taxFee !== undefined ||
    (explicitTax !== null &&
      (typeof explicitTax.name === "string" ||
        typeof explicitTax.value === "number" ||
        typeof explicitTax.amount === "number"));
  const subtotal =
    typeof root.subtotal === "number"
      ? root.subtotal
      : typeof pricing?.subtotal === "number"
        ? pricing.subtotal
        : 0;
  const total =
    typeof root.total === "number"
      ? root.total
      : typeof pricing?.total === "number"
        ? pricing.total
        : subtotal;
  const checkoutTable = record(root.table);
  const paymentFee = record(root.payment_fee);
  const deliveryFee = record(root.delivery_fee);
  const rawFees = [
    ...rawPricingFees.filter((fee) => fee !== taxFee),
    ...(extractNumber(paymentFee?.amount) > 0 ? [paymentFee] : []),
    ...(extractNumber(deliveryFee?.amount) > 0 ? [deliveryFee] : []),
  ];
  const items = extractOrderItems(order.products);
  const coupons = Array.isArray(root.coupons) ? root.coupons : [];

  return {
    code: order.code,
    date: dateLabel(order.created_at),
    orderType: order.order_type === "dine-in" ? "Dine-in" : "Takeaway",
    table:
      typeof checkoutTable?.name === "string"
        ? checkoutTable.name
        : extractTableName(root.orderable),
    payment: extractPaymentName(order.payment),
    paymentStatus: "payment_status" in order ? extractStatusLabel(order.payment_status) : "Paid",
    items: items.map((item, itemIndex) => ({
      id: `${order.code}-item-${itemIndex}`,
      ...item,
      notes: record(order.products[itemIndex])?.notes as string | null | undefined,
      addOns: item.addOns.flatMap((addOn, addOnIndex) =>
        addOn.options.map((option, optionIndex) => ({
          id: `${order.code}-addon-${itemIndex}-${addOnIndex}-${optionIndex}`,
          group: addOn.name,
          ...option,
        }))
      ),
    })),
    subtotal,
    discounts: coupons
      .map((coupon, index) => {
        const value = record(coupon);
        return {
          id: `discount-${index}`,
          name: typeof value?.code === "string" ? `Discount (${value.code})` : "Discount",
          amount: extractNumber(value?.discount_amount),
        };
      })
      .filter((discount) => discount.amount > 0),
    fees: rawFees
      .map((fee, index) => {
        const value = record(fee);
        return {
          id: `${String(value?.type ?? "fee")}-${index}`,
          name: typeof value?.name === "string" ? value.name : "Fee",
          amount: extractNumber(value?.amount),
        };
      })
      .filter((fee) => fee.amount > 0),
    tax: taxIsEnabled
      ? {
          name:
            typeof taxRecord?.name === "string" && taxRecord.name.trim() ? taxRecord.name : "Tax",
          amount: taxAmount,
        }
      : null,
    total,
    notes: order.notes,
  };
}
