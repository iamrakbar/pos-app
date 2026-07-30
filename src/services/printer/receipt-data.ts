import {
  extractNumber,
  extractOrderItems,
  extractPaymentName,
  extractTableName,
  getPaymentStatus,
} from "@/api/mappers/order";
import type { ReceiptPreviewData } from "@/components/receipt/receipt-paper";
import { getLocaleTag, i18n, t as globalTranslate, type Locale, type Translate } from "@/locales";
import type { ReceiptOrder } from "./escpos";

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function dateLabel(value: string, locale: Locale): string {
  return new Date(value).toLocaleString(getLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function paymentStatusLabel(value: string, fallback: string, t: Translate): string {
  if (["pending", "unpaid"].includes(value)) return t("payment.statusPending");
  if (["settlement", "capture", "paid", "success"].includes(value)) return t("payment.statusPaid");
  if (["authorize", "authorized"].includes(value)) return t("payment.statusAuthorized");
  if (["refund", "refunded"].includes(value)) return t("payment.statusRefunded");
  if (value === "partial_refund") return t("payment.statusPartiallyRefunded");
  if (["deny", "denied"].includes(value)) return t("payment.statusDenied");
  if (["cancel", "cancelled", "canceled"].includes(value)) return t("payment.statusCancelled");
  if (["expire", "expired"].includes(value)) return t("payment.statusExpired");
  if (["failure", "failed"].includes(value)) return t("payment.statusFailed");
  return fallback;
}

export function toReceiptData(
  order: ReceiptOrder,
  locale: Locale = i18n.locale,
  t: Translate = globalTranslate
): ReceiptPreviewData {
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
    date: dateLabel(order.created_at, locale),
    orderType: order.order_type === "dine-in" ? t("receipt.dineIn") : t("receipt.takeaway"),
    table:
      typeof checkoutTable?.name === "string"
        ? checkoutTable.name
        : extractTableName(root.orderable),
    payment: extractPaymentName(order.payment),
    paymentStatus:
      "payment_status" in order
        ? (() => {
            const status = getPaymentStatus(order.payment_status);
            return paymentStatusLabel(status.value, status.label, t);
          })()
        : t("receipt.paid"),
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
    discounts: coupons.flatMap((coupon, index) => {
      const value = record(coupon);
      const discount = {
        id: `discount-${index}`,
        name:
          typeof value?.code === "string"
            ? t("receipt.discountWithCode", { code: value.code })
            : t("receipt.discount"),
        amount: extractNumber(value?.discount_amount),
      };
      return discount.amount > 0 ? [discount] : [];
    }),
    fees: rawFees.flatMap((fee, index) => {
      const value = record(fee);
      const receiptFee = {
        id: `${String(value?.type ?? "fee")}-${index}`,
        name: typeof value?.name === "string" ? value.name : t("receipt.fee"),
        amount: extractNumber(value?.amount),
      };
      return receiptFee.amount > 0 ? [receiptFee] : [];
    }),
    tax: taxIsEnabled
      ? {
          name:
            typeof taxRecord?.name === "string" && taxRecord.name.trim()
              ? taxRecord.name
              : t("receipt.tax"),
          amount: taxAmount,
        }
      : null,
    total,
    notes: order.notes,
  };
}
