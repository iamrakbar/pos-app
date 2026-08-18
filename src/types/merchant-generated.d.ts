declare namespace App.Data.Merchant.AddOn {
export type AddOnData = {
id: string;
product_id: string;
name: string;
min: number;
max: number;
options: Array<App.Data.Merchant.AddOn.OptionData>;
options_count: number;
created_at: string;
updated_at: string;
};
export type OptionData = {
id: string;
add_on_id: string;
name: string;
price: number;
};
}
declare namespace App.Data.Merchant.Analytics {
export type OrdersChartData = {
date: string;
count: number;
};
export type TopProductData = {
product_id: string;
name: string;
qty_sold: number;
revenue: number;
};
}
declare namespace App.Data.Merchant.Area {
export type AreaData = {
id: string;
name: string;
tables_count: number;
created_at: string;
};
export type TableData = {
id: string;
area_id: string;
name: string;
pax: number;
active: boolean;
created_at: string;
};
}
declare namespace App.Data.Merchant.Auth {
export type AuthTokenData = {
access_token: string;
token_type: string;
expires_in: number;
user: App.Data.Merchant.Auth.MerchantUserProfileData;
merchants: Array<App.Data.Merchant.Auth.MerchantSummaryData>;
};
export type MerchantSummaryData = {
id: string;
name: string;
slug: string;
logo_url: string | null;
};
export type MerchantUserProfileData = {
id: string;
name: string;
email: string;
role: string;
role_label: string;
};
}
declare namespace App.Data.Merchant.Cancellation {
export type CancellationRequestData = {
id: string;
order_id: string;
reason: string | null;
rejection_reason: string | null;
status: Array<any>;
reviewed_at: string | null;
created_at: string;
};
}
declare namespace App.Data.Merchant.Category {
export type CategoryData = {
id: string;
merchant_id: string;
name: string;
slug: string;
description: string | null;
position: number;
active: boolean;
products_count: number;
created_at: string;
updated_at: string;
};
}
declare namespace App.Data.Merchant.Checkout {
export type CheckoutCouponData = {
code: string;
discount_amount: number;
};
export type CheckoutCustomerData = {
id: string | null;
name: string | null;
email: string | null;
phone: string | null;
type: string | null;
};
export type CheckoutData = {
id: string;
code: string;
merchant_id: string;
merchant: App.Data.Merchant.Checkout.CheckoutMerchantData;
customer: App.Data.Merchant.Checkout.CheckoutCustomerData | null;
order_type: string;
order_status: App.Data.Merchant.Checkout.CheckoutOrderStatusData;
table: App.Data.Merchant.Checkout.CheckoutTableData | null;
pickup_time: string | null;
payment_id: string;
payment: App.Data.Merchant.Order.OrderPaymentData;
notes: string | null;
products: Array<App.Data.Merchant.Checkout.CheckoutProductData>;
pricing: App.Data.Merchant.Checkout.CheckoutPricingData;
coupons: Array<App.Data.Merchant.Checkout.CheckoutCouponData>;
payment_details: App.Data.Merchant.Order.OrderPaymentDetailsData;
created_at: string;
};
export type CheckoutMerchantData = {
id: string | null;
name: string;
image: App.Data.Merchant.Checkout.CheckoutMerchantImageData | null;
};
export type CheckoutMerchantImageData = {
default: string | null;
thumbnail: string | null;
};
export type CheckoutOrderStatusData = {
value: string;
label: string;
color: string;
};
export type CheckoutPricingData = {
subtotal: number;
fees: Array<App.Data.Merchant.Checkout.CheckoutPricingFeeData>;
total: number;
};
export type CheckoutPricingFeeData = {
type: string;
name: string;
amount: number;
};
export type CheckoutProductData = {
product_id: string;
name: string;
price: number;
qty: number;
notes: string | null;
add_ons: Array<App.Data.Merchant.Order.OrderProductAddOnData>;
subtotal: number;
};
export type CheckoutTableData = {
id: string | null;
name: string | null;
};
}
declare namespace App.Data.Merchant.Coupon {
export type CouponData = {
id: string;
code: string;
unit: string;
value: number;
type: string;
start_date: string | null;
end_date: string | null;
limit_per_user: number;
limit_quota: number | null;
used_quota: number;
rules_count: number;
active: boolean;
created_at: string;
};
}
declare namespace App.Data.Merchant.Customer {
export type CustomerData = {
id: string;
name: string;
email: string | null;
phone: string | null;
orders_count: number;
created_at: string;
};
export type CustomerSearchData = {
id: string;
name: string;
email: string | null;
phone: string | null;
};
}
declare namespace App.Data.Merchant.Dashboard {
export type DashboardData = {
orders_today: number;
revenue_today: number;
pending_orders: number;
completed_orders: number;
orders_chart: Array<{ date: string; count: number }>;
best_sellers: Array<{ product_id: string; name: string; qty_sold: number; revenue: number }>;
period: { start: string; end: string };
};
}
declare namespace App.Data.Merchant.Delivery {
export type DeliveryDetailData = {
waybill_id: string | null;
tracking_status: Array<any> | null;
dispatched_at: string | null;
can_dispatch: boolean;
delivery_mode: string | null;
courier: Array<any> | null;
driver: Array<any> | null;
address: Array<any> | null;
delivery_fee: number;
};
export type DeliveryTrackingData = {
order_id: string;
order_code: string;
waybill_id: string | null;
current_status: Array<any> | null;
dispatched_at: string | null;
courier: Array<any> | null;
driver: Array<any> | null;
tracking_history: Array<any>;
};
export type DispatchDeliveryData = {
order_id: string;
order_code: string;
tracking_status: Array<any> | null;
delivery_mode: string;
courier: Array<any> | null;
};
export type SubmitWaybillData = {
order_id: string;
order_code: string;
waybill_id: string;
courier_code: string;
tracking_status: Array<any> | null;
};
}
declare namespace App.Data.Merchant.Discount {
export type DiscountData = {
id: string;
name: string;
unit: string;
value: number;
products_count: number;
active: boolean;
start: string | null;
end: string | null;
created_at: string;
};
}
declare namespace App.Data.Merchant.Earnings {
export type EarningData = {
id: string;
code: string;
order_type: string;
items_count: number;
total_price: number;
created_at: string;
};
}
declare namespace App.Data.Merchant.Finance {
export type BeneficiaryData = {
id: string;
account_number: string;
account_holder: string | null;
is_default: boolean;
is_validated: boolean;
disbursement_id: string | null;
disbursement_name: string | null;
disbursement_code: string | null;
disbursement_group: string | null;
created_at: string;
};
export type PayoutData = {
id: string;
status: Array<any>;
amount: number;
fee: number;
app_fee: number;
balance_before: number;
balance_after: number;
reference_no: string | null;
notes: string | null;
rejection_message: string | null;
beneficiary_bank_name: string | null;
beneficiary_account_number: string | null;
beneficiary_account_holder: string | null;
created_at: string;
};
}
declare namespace App.Data.Merchant.Gallery {
export type GalleryData = {
id: string;
name: string;
category: Array<any>;
active: boolean;
image_url: string;
thumbnail_url: string;
created_at: string;
};
}
declare namespace App.Data.Merchant.Guest {
export type GuestData = {
id: string;
merchant_id: string;
name: string;
email: string | null;
phone: string | null;
created_at: string;
updated_at: string;
};
}
declare namespace App.Data.Merchant.Order {
export type OrderCustomerData = {
name: string | null;
email: string | null;
phone: string | null;
type: string | null;
};
export type OrderData = {
id: string;
code: string;
merchant: App.Data.Merchant.Auth.MerchantSummaryData;
customer: App.Data.Merchant.Order.OrderCustomerData;
payment: App.Data.Merchant.Order.OrderPaymentData;
order_type: string;
order_status: App.Data.Merchant.Order.OrderStatusDetailData;
payment_status: App.Data.Merchant.Order.OrderPaymentStatusDetailData;
notes: string | null;
products: Array<App.Data.Merchant.Order.OrderProductData>;
subtotal: number;
tax: App.Data.Merchant.Order.OrderTaxData;
delivery_fee: App.Data.Merchant.Order.OrderDeliveryFeeData | null;
payment_fee: App.Data.Merchant.Order.OrderPaymentFeeData;
total_tax_and_fee: number;
total: number;
orderable: App.Data.Merchant.Order.OrderOrderableData | null;
payment_instruction: App.Data.Merchant.Order.OrderPaymentInstructionData | null;
payment_details: App.Data.Merchant.Order.OrderPaymentDetailsData;
created_at: string;
};
export type OrderDeliveryFeeData = {
name: string;
amount: number;
};
export type OrderListData = {
id: string;
code: string;
merchant: App.Data.Merchant.Auth.MerchantSummaryData;
customer: Array<any>;
payment: Array<any>;
order_type: string;
order_status: Array<any>;
payment_status: Array<any>;
total: number;
products_count: number;
orderable: Array<any> | null;
created_at: string;
};
export type OrderOrderableAddressData = {
id: string | null;
name: string | null;
address: string | null;
province: string | null;
city: string | null;
district: string | null;
postcode: string | null;
lat: string | number | null;
lng: string | number | null;
};
export type OrderOrderableCourierData = {
code: string | null;
name: string | null;
service: string | null;
description: string | null;
rate: number | null;
insurance_fee: number | null;
must_use_insurance: boolean | null;
};
export type OrderOrderableData = {
pickup_time: string | null;
table_id: string | null;
table_name: string | null;
address: App.Data.Merchant.Order.OrderOrderableAddressData | null;
courier: App.Data.Merchant.Order.OrderOrderableCourierData | null;
tracking_status: App.Data.Merchant.Order.OrderOrderableTrackingStatusData | null;
waybill_id: string | null;
};
export type OrderOrderableTrackingStatusData = {
value: string;
label: string;
color: string;
is_delivered: boolean;
};
export type OrderPaymentData = {
id: string | null;
name: string;
code: string;
group_type: 'cash' | 'card' | 'bank_transfer' | 'qris' | 'e_wallet' | 'food_delivery' | 'marketplace' | 'over_the_counter';
processing_mode: 'merchant_collected' | 'external_platform' | 'gateway';
tender_type: 'amount' | 'reference' | 'none';
tender_value: string | null;
amount_received: number | null;
change_due: number;
reference: string | null;
};
export type OrderPaymentDetailsData = {
code: string | null;
extra: string | null;
expiry_time: string | null;
};
export type OrderPaymentFeeData = {
name: string;
unit: string | null;
value: number | null;
amount: number | null;
};
export type OrderPaymentInstructionData = {
en: string | null;
id: string | null;
};
export type OrderPaymentStatusDetailData = {
value: string;
label: string;
color: string;
is_successful: boolean;
};
export type OrderProductAddOnData = {
id: string;
name: string;
options: Array<App.Data.Merchant.Order.OrderProductOptionData>;
};
export type OrderProductData = {
product_id: string;
name: string;
price: number;
discount: App.Data.Merchant.Order.OrderProductDiscountData | null;
qty: number;
notes: string | null;
add_ons: Array<App.Data.Merchant.Order.OrderProductAddOnData>;
subtotal: number;
};
export type OrderProductDiscountData = {
unit: string | null;
value: number | null;
price: number | null;
};
export type OrderProductOptionData = {
id: string;
name: string;
price: number;
};
export type OrderStatusData = {
id: string;
code: string;
order_status: Array<any>;
cancelled_at: string | null;
updated_at: string;
};
export type OrderStatusDetailData = {
value: string;
label: string;
color: string;
is_final: boolean;
can_be_cancelled: boolean;
next_status: string | null;
};
export type OrderTaxData = {
name: string | null;
value: number | null;
amount: number | null;
};
export type PaymentStatusData = {
order_id: string;
order_code: string;
payment: Array<any>;
payment_status: string;
payment_status_label: string;
payment_status_color: string;
is_successful: boolean;
};
}
declare namespace App.Data.Merchant.Payment {
export type MerchantPaymentData = {
id: string;
merchant_payment_id: string;
code: string;
name: string;
image: string | null;
fees: App.Data.Merchant.Payment.MerchantPaymentFeesData;
group: App.Data.Merchant.Payment.MerchantPaymentGroupData;
provider: App.Data.Merchant.Payment.MerchantPaymentProviderData;
tender_input: App.Data.Merchant.Payment.MerchantTenderInputData;
processing_mode: App.Data.Merchant.Payment.MerchantPaymentProcessingModeData;
sort: number;
is_active: boolean;
};
export type MerchantPaymentFeesData = {
payment_fee: number;
app_fee: number;
total_fee: number;
unit: 'fixed' | 'percentage';
};
export type MerchantPaymentGroupData = {
value: 'cash' | 'card' | 'bank_transfer' | 'qris' | 'e_wallet' | 'food_delivery' | 'marketplace' | 'over_the_counter';
label: string;
};
export type MerchantPaymentProcessingModeData = {
value: 'merchant_collected' | 'external_platform' | 'gateway';
label: string;
};
export type MerchantPaymentProviderData = {
value: string;
label: string;
};
export type MerchantTenderInputData = {
type: 'amount' | 'reference' | 'none';
label: string | null;
placeholder: string | null;
required: boolean;
};
}
declare namespace App.Data.Merchant.Pos {
export type PosTableData = {
id: string;
name: string;
area_id: string;
area_name: string;
pax: number;
};
export type ProductCategoryData = {
id: string;
name: string;
slug: string | null;
};
export type ProductData = {
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
add_ons: Array<any>;
is_active: boolean;
is_po: boolean;
po_availability: App.Data.Merchant.Pos.ProductPoAvailabilityData | null;
created_at: string;
updated_at: string;
};
export type ProductDiscountData = {
unit: string | null;
value: number | null;
price: number | null;
};
export type ProductImageData = {
default: string | null;
thumbnail: string | null;
};
export type ProductPoAvailabilityData = {
value: number;
unit: string | null;
in_days: number | null;
};
export type ProductStockData = {
enabled: boolean;
qty: number | null;
};
}
declare namespace App.Data.Merchant.Product {
export type ProductAddOnData = {
id: string;
name: string;
min: number;
max: number;
required: boolean;
multiple: boolean;
options: Array<App.Data.Merchant.Product.ProductOptionData>;
};
export type ProductCategoryData = {
id: string;
name: string;
slug: string | null;
};
export type ProductData = {
id: string;
merchant_id: string;
name: string;
slug: string;
code: string | null;
description: string | null;
price: number;
cost: number | null;
stock: App.Data.Merchant.Product.ProductStockData;
active: boolean;
image: App.Data.Merchant.Product.ProductImageData;
category: App.Data.Merchant.Product.ProductCategoryData | null;
discount: App.Data.Merchant.Product.ProductDiscountData | null;
add_ons: Array<App.Data.Merchant.Product.ProductAddOnData>;
created_at: string;
updated_at: string;
};
export type ProductDiscountData = {
unit: string;
value: number;
price: number;
};
export type ProductImageData = {
default: string | null;
thumbnail: string | null;
};
export type ProductOptionData = {
id: string;
name: string;
price: number;
};
export type ProductStockData = {
enabled: boolean;
qty: number | null;
alert: number | null;
};
}
declare namespace App.Data.Merchant.Profile {
export type MerchantAddressData = {
address: string | null;
province: string | null;
city: string | null;
district: string | null;
village: string | null;
postcode: string | null;
lat: number | null;
lng: number | null;
};
export type MerchantProfileData = {
id: string;
name: string;
slug: string;
description: string | null;
phone: string | null;
email: string | null;
website: string | null;
terms: string | null;
dine_in: boolean;
takeaway: boolean;
delivery: boolean;
auto_process_on_payment_settlement: boolean;
tax_is_enable: boolean;
tax_name: string | null;
tax_value: number | null;
charge_app_payment_fee_to_customer: boolean;
logo_url: string | null;
cover_url: string | null;
address: App.Data.Merchant.Profile.MerchantAddressData | null;
has_schedule: boolean;
schedule: Record<string, Array<{ open: string; close: string }>>;
features: Array<string>;
created_at: string;
updated_at: string;
};
}
declare namespace App.Data.Merchant.Review {
export type MerchantReviewData = {
id: string;
customer_name: string | null;
rating: number;
title: string | null;
text: string | null;
status: Array<any>;
created_at: string;
};
}
declare namespace App.Data.Merchant.Staff {
export type StaffData = {
id: string;
name: string;
email: string;
phone: string | null;
role: Array<any>;
created_at: string;
};
}
declare namespace App.Data.Merchant.Subscription {
export type SubscriptionData = {
id: string;
plan_key: string;
plan_name: string | null;
status: Array<any>;
is_active: boolean;
is_trial: boolean;
days_remaining: number;
starts_at: string;
ends_at: string;
cancelled_at: string | null;
};
export type SubscriptionPaymentData = {
id: string;
plan_key: string;
plan_name: string | null;
amount: number;
payment_status: string;
order_id: string | null;
snap_token: string | null;
new_ends_at: string | null;
paid_at: string | null;
created_at: string;
};
}
