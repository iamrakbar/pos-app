export type PricingInput = {
  subtotal: number;
  taxIsEnabled: boolean | undefined;
  taxValue: number | null | undefined;
  taxName: string | null | undefined;
  feeUnit: "fixed" | "percentage" | undefined;
  feeValue: number | undefined;
  chargeAppPaymentFeeToCustomer: boolean | undefined;
};

export type PricingResult = {
  taxAmount: number;
  taxName: string | null;
  subtotalWithTax: number;
  paymentFeeAmount: number;
  total: number;
};

export function computePricing({
  subtotal,
  taxIsEnabled,
  taxValue,
  taxName,
  feeUnit,
  feeValue,
  chargeAppPaymentFeeToCustomer,
}: PricingInput): PricingResult {
  const taxAmount =
    taxIsEnabled && taxValue ? Math.round(subtotal * (taxValue / 100)) : 0;
  const subtotalWithTax = subtotal + taxAmount;

  const paymentFeeAmount =
    chargeAppPaymentFeeToCustomer && feeUnit && feeValue !== undefined
      ? feeUnit === "percentage"
        ? Math.round(subtotalWithTax * (feeValue / 100))
        : feeValue
      : 0;

  return {
    taxAmount,
    taxName: taxIsEnabled ? (taxName ?? null) : null,
    subtotalWithTax,
    paymentFeeAmount,
    total: subtotalWithTax + paymentFeeAmount,
  };
}
