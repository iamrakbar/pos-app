import { asRecord } from "./shared";

export type StatusColor = "accent" | "success" | "warning" | "danger" | "default";

export type StatusPresentation = {
  value: string;
  label: string;
  color: StatusColor;
};

const ORDER_STATUSES: Record<string, Omit<StatusPresentation, "value">> = {
  new: { label: "New", color: "warning" },
  process: { label: "Processing", color: "accent" },
  completed: { label: "Completed", color: "success" },
  cancelled: { label: "Cancelled", color: "danger" },
  canceled: { label: "Cancelled", color: "danger" },
  rejected: { label: "Rejected", color: "danger" },
};

const PAYMENT_STATUSES: Record<string, Omit<StatusPresentation, "value">> = {
  pending: { label: "Pending", color: "warning" },
  unpaid: { label: "Pending", color: "warning" },
  settlement: { label: "Paid", color: "success" },
  capture: { label: "Paid", color: "success" },
  paid: { label: "Paid", color: "success" },
  success: { label: "Paid", color: "success" },
  authorize: { label: "Authorized", color: "accent" },
  authorized: { label: "Authorized", color: "accent" },
  refund: { label: "Refunded", color: "warning" },
  refunded: { label: "Refunded", color: "warning" },
  partial_refund: { label: "Partially refunded", color: "warning" },
  deny: { label: "Denied", color: "danger" },
  denied: { label: "Denied", color: "danger" },
  cancel: { label: "Cancelled", color: "danger" },
  cancelled: { label: "Cancelled", color: "danger" },
  canceled: { label: "Cancelled", color: "danger" },
  expire: { label: "Expired", color: "danger" },
  expired: { label: "Expired", color: "danger" },
  failure: { label: "Failed", color: "danger" },
  failed: { label: "Failed", color: "danger" },
};

function extractStatusRecord(status: unknown): Record<string, unknown> | null {
  if (Array.isArray(status)) {
    return status.length > 0 ? extractStatusRecord(status[0]) : null;
  }
  return asRecord(status);
}

export function extractStatusValue(status: unknown): string {
  const rec = extractStatusRecord(status);
  if (rec) {
    if (typeof rec.value === "string") return rec.value.toLowerCase();
    if (typeof rec.code === "string") return rec.code.toLowerCase();
    if (typeof rec.status === "string") return rec.status.toLowerCase();
  }
  return typeof status === "string" ? status.toLowerCase() : "unknown";
}

function extractApiStatusColor(status: unknown): StatusColor {
  const color = extractStatusRecord(status)?.color;
  if (typeof color !== "string") return "default";

  const normalized = color.toLowerCase();
  if (["success", "green"].includes(normalized)) return "success";
  if (["warning", "yellow", "orange"].includes(normalized)) return "warning";
  if (["danger", "error", "red"].includes(normalized)) return "danger";
  if (["accent", "primary", "blue"].includes(normalized)) return "accent";
  return "default";
}

export function extractStatusLabel(status: unknown): string {
  const rec = extractStatusRecord(status);
  if (rec) {
    if (typeof rec.label === "string") return rec.label;
    if (typeof rec.name === "string") return rec.name;
    if (typeof rec.value === "string") return rec.value;
  }
  if (typeof status === "string") return status;
  return "Unknown";
}

function getStatusPresentation(
  status: unknown,
  mapping: Record<string, Omit<StatusPresentation, "value">>
): StatusPresentation {
  const value = extractStatusValue(status);
  const mapped = mapping[value];
  return mapped
    ? { value, ...mapped }
    : { value, label: extractStatusLabel(status), color: extractApiStatusColor(status) };
}

export function getOrderStatus(status: unknown): StatusPresentation {
  return getStatusPresentation(status, ORDER_STATUSES);
}

export function getPaymentStatus(status: unknown): StatusPresentation {
  return getStatusPresentation(status, PAYMENT_STATUSES);
}

export function extractStatusColor(status: unknown): StatusColor {
  return extractApiStatusColor(status);
}

export function extractCustomerName(customer: unknown): string | null {
  const rec = asRecord(customer);
  if (rec && typeof rec.name === "string") return rec.name;
  return null;
}

export function extractTableName(orderable: unknown): string | null {
  const rec = asRecord(orderable);
  if (!rec) return null;
  if (typeof rec.table_name === "string") return rec.table_name;
  if (typeof rec.name === "string") return rec.name;
  const table = asRecord(rec.table);
  if (table && typeof table.name === "string") return table.name;
  return null;
}

export function extractPaymentName(payment: unknown): string {
  const rec = asRecord(payment);
  if (rec && typeof rec.name === "string") return rec.name;
  return "Unknown";
}

export function extractNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return value;
  const rec = asRecord(value);
  if (rec && typeof rec.amount === "number") return rec.amount;
  return fallback;
}

export type OrderLineItemAddOn = {
  name: string;
  options: { name: string; price: number }[];
};

export type OrderLineItem = {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
  addOns: OrderLineItemAddOn[];
};

export function extractOrderItems(products: unknown): OrderLineItem[] {
  if (!Array.isArray(products)) return [];
  return products.map((raw) => {
    const rec = asRecord(raw) ?? {};
    const name = typeof rec.name === "string" ? rec.name : "Unknown item";
    const qty = typeof rec.qty === "number" ? rec.qty : 1;
    const price =
      typeof rec.price === "number"
        ? rec.price
        : typeof rec.subtotal === "number" && qty > 0
          ? rec.subtotal / qty
          : 0;
    const subtotal = typeof rec.subtotal === "number" ? rec.subtotal : price * qty;
    const addOns = Array.isArray(rec.add_ons)
      ? rec.add_ons.map((rawAddOn) => {
          const addOn = asRecord(rawAddOn) ?? {};
          return {
            name: typeof addOn.name === "string" ? addOn.name : "Add-on",
            options: Array.isArray(addOn.options)
              ? addOn.options.map((rawOption) => {
                  const option = asRecord(rawOption) ?? {};
                  return {
                    name: typeof option.name === "string" ? option.name : "Option",
                    price: typeof option.price === "number" ? option.price : 0,
                  };
                })
              : [],
          };
        })
      : [];
    return { name, qty, price, subtotal, addOns };
  });
}

export type PaymentFee = { unit: "fixed" | "percentage"; value: number };

// Confirmed shape from the `GET /payments` endpoint's own documentation:
// { payment_fee, app_fee, total_fee, unit: "fixed" | "percentage" }.
// `total_fee` is the combined payment+app fee to charge; `unit` says whether
// it's a flat amount or a percentage of the order subtotal.
export function extractFee(fees: unknown): PaymentFee {
  const rec = asRecord(fees);
  if (
    rec &&
    typeof rec.total_fee === "number" &&
    (rec.unit === "fixed" || rec.unit === "percentage")
  ) {
    return { unit: rec.unit, value: rec.total_fee };
  }
  return { unit: "fixed", value: 0 };
}
