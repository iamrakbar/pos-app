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
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  thumbnail_url: string | null;
  category_id: string | null;
  add_ons: AddOnGroup[];
  is_active: boolean;
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
  fee_rate: number;
};

export type POSPaymentGroup = {
  group_type: string;
  group_label: string;
  payments: POSPayment[];
};

export type CheckoutFormState = {
  order_type: 'dine-in' | 'takeaway';
  table_id: string | null;
  payment_group: 'e-money' | 'cash';
  payment_id: string | null;
  customer_type: 'merchant' | 'registered';
  customer_search: string;
  notes: string;
};

export type PaymentSession = {
  transaction_id: string;
  payment_type: string;
  qr_url: string | null;
  amount: number;
};
