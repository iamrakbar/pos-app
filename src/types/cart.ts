export type CartAddOnOption = {
  id: string;
  name: string;
  price: number;
};

export type CartAddOn = {
  id: string;
  name: string;
  options: CartAddOnOption[];
};

export type CartItem = {
  id: string;
  product_id: string;
  name: string;
  price: number;
  qty: number;
  notes?: string | null;
  add_ons: CartAddOn[];
  subtotal: number;
};

export type Cart = {
  merchant_id: string | null;
  table_id: string | null;
  products: CartItem[];
  notes: string;
};

export type CartAction = {
  setMerchantId: (id: string) => void;
  setTableId: (id: string) => void;
  setMerchantIdAndTableId: (merchant_id: string, table_id: string) => void;
  setCartNotes: (notes: string) => void;
  totalQty: () => number;
  totalPrice: () => number;
  getItemTotal: (id: string) => number;
  addItem: (item: {
    product_id: string;
    name: string;
    price: number;
    qty: number;
    notes?: string | null;
    add_ons: CartAddOn[];
  }) => void;
  updateQty: (id: string, qty: number) => void;
  updateItemNotes: (id: string, notes: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  resetCart: () => void;
};
