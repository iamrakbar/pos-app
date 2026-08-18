export type AddOnOption = {
  id: string;
  name: string;
  price: number;
};

export type AddOnGroup = {
  id: string;
  name: string;
  min: number;
  max: number;
  required: boolean;
  multiple: boolean;
  options: AddOnOption[];
};

export type POSProduct = {
  id: string;
  merchant_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  discount: App.Data.Merchant.Pos.ProductDiscountData | null;
  stock: App.Data.Merchant.Pos.ProductStockData;
  image: App.Data.Merchant.Pos.ProductImageData;
  category: App.Data.Merchant.Pos.ProductCategoryData | null;
  add_ons: AddOnGroup[];
  is_active: boolean;
  is_po: boolean;
  po_availability: App.Data.Merchant.Pos.ProductPoAvailabilityData | null;
  created_at: string;
  updated_at: string;
};

export type POSCategory = {
  id: string;
  name: string;
};

export type POSTable = {
  id: string;
  name: string;
  area_id: string;
  area_name: string;
  pax: number;
};

export type POSPayment = {
  id: string;
  code: string;
  name: string;
  fee_unit: "fixed" | "percentage";
  fee_value: number;
  merchant_payment_id: string;
  image: string | null;
  provider: App.Data.Merchant.Payment.MerchantPaymentProviderData;
  tender_input: App.Data.Merchant.Payment.MerchantTenderInputData;
  processing_mode: App.Data.Merchant.Payment.MerchantPaymentProcessingModeData;
  sort: number;
  is_active: boolean;
};

export type POSPaymentGroup = {
  group_type: App.Requests.Merchant.PaymentGroupEnum;
  group_label: string;
  payments: POSPayment[];
};

export type CheckoutFormState = {
  order_type: "dine-in" | "takeaway";
  table_id: string | null;
  pickup_time: string | null;
  customer_type: "guest" | "customer" | "anonymous";
  guest_id: string | null;
  customer_id: string | null;
  customer_search: string;
  notes: string;
};

export type PaymentSession = {
  order_id: string;
  transaction_id: string;
  payment_type: string;
  qr_url: string | null;
  expires_at: string | null;
  amount: number;
  cash_received?: number;
  change?: number;
  reference?: string;
  processing_mode: App.Data.Merchant.Payment.MerchantPaymentProcessingModeData["value"];
};
