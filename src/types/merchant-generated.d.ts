declare namespace App.Data.Customer.Address {
export type AddressData = {
id: string;
name: string | null;
address: string;
phone: string | null;
receiver_name: string | null;
notes: string | null;
province: string | null;
city: string | null;
district: string | null;
village: string | null;
postcode: string | null;
lat: number | null;
lng: number | null;
is_default: boolean;
created_at: string;
};
}
declare namespace App.Data.Customer.Auth {
export type AuthTokenData = {
access_token: string;
token_type: string;
expires_in: number;
user: App.Data.Customer.Auth.CustomerProfileData;
};
export type CustomerProfileData = {
id: string;
name: string;
email: string;
phone: string | null;
avatar: string | null;
created_at: string;
};
}
declare namespace App.Data.Customer.BankAccount {
export type BankAccountData = {
id: string;
bank_code: string | null;
bank_name: string | null;
account_number: string;
account_holder: string;
is_default: boolean;
is_validated: boolean;
created_at: string;
};
}
declare namespace App.Data.Customer.Checkout {
export type CartValidationData = {
products: Array<any>;
merchant_id: string;
coupons: Array<any> | null;
};
export type CheckoutData = {
id: string;
code: string;
merchant_id: string;
merchant: Array<any>;
table: Array<any> | null;
pickup_time: string | null;
delivery: Array<any> | null;
payment_id: string;
payment: Array<any>;
customer: Array<any> | null;
order_type: string;
order_status: Array<any>;
notes: string | null;
products: Array<any>;
pricing: Array<any>;
coupons: Array<any>;
created_at: string;
time_ago: string;
};
}
declare namespace App.Data.Customer.Coupon {
export type CouponData = {
id: string;
code: string;
value: number;
unit: string;
type: string;
start_date: string | null;
end_date: string | null;
limit_per_user: number | null;
remaining_quota: number | null;
rules: Array<any>;
};
}
declare namespace App.Data.Customer.Courier {
export type CourierData = {
id: string;
name: string;
code: string;
service_name: string | null;
service_code: string | null;
description: string | null;
provider: string;
is_active: boolean;
supports_cash_on_delivery: boolean;
supports_proof_of_delivery: boolean;
supports_instant_waybill: boolean;
};
}
declare namespace App.Data.Customer.Delivery {
export type DeliveryRateData = {
courier_code: string | null;
courier_name: string | null;
courier_service_code: string | null;
courier_service_name: string | null;
description: string | null;
duration: string | null;
shipment_duration_range: string | null;
shipment_duration_unit: string | null;
service_type: string | null;
shipping_type: string | null;
price: number;
type: string | null;
};
export type DeliveryTrackingData = {
order_id: string;
order_code: string;
waybill_id: string | null;
current_status: string | null;
status_label: string | null;
courier: Array<any>;
destination: Array<any>;
tracking: Array<any> | null;
local_history: Array<any> | null;
};
}
declare namespace App.Data.Customer.Gallery {
export type GalleryData = {
id: string;
name: string;
category: string | null;
category_label: string | null;
images: Array<any>;
created_at: string;
};
}
declare namespace App.Data.Customer.Merchant {
export type LocationData = {
lat: number;
lng: number;
};
export type MerchantData = {
id: string;
name: string;
slug: string;
description: string | null;
phone: string | null;
email: string | null;
website: string | null;
address: string | null;
postcode: number | null;
province: string | null;
city: string | null;
district: string | null;
location: App.Data.Customer.Merchant.LocationData | null;
distance: string | null;
dine_in: boolean;
takeaway: boolean;
delivery: boolean;
has_schedule: boolean;
operating_hours: Array<any>;
tax: Array<any>;
charge_payment_fee_to_customer: boolean;
is_active: boolean;
is_featured: boolean;
image: Array<any> | null;
cover: Array<any> | null;
cuisines: Array<any>;
restaurant_types: Array<any>;
terms: Array<any> | string | null;
products?: Array<App.Data.Customer.Product.ProductData>;
created_at: string | null;
updated_at: string | null;
};
}
declare namespace App.Data.Customer.Notification {
export type NotificationData = {
id: string;
type: string;
data: Array<any>;
title: string | null;
body: string | null;
is_read: boolean;
read_at: string | null;
created_at: string;
};
}
declare namespace App.Data.Customer.Order {
export type CancellationRequestData = {
id: string;
order_id: string;
status: string;
status_label: string;
reason: string | null;
rejection_reason: string | null;
reviewed_at: string | null;
created_at: string;
};
export type CancellationStatusData = {
order_id: string;
order_status: string;
can_cancel: boolean;
requires_approval: boolean;
pending_request: Array<any> | null;
fee_preview: Array<any> | null;
};
export type OrderListData = {
id: string;
code: string;
merchant: Array<any>;
payment: Array<any>;
order_type: string;
order_status: Array<any>;
display_status: Array<any>;
payment_fee_charged_to_customer: boolean;
payment_status: Array<any>;
total: number;
products_count: number;
orderable: Array<any> | null;
created_at: string;
};
export type PaymentStatusData = {
order_id: string;
order_code: string;
payment: Array<any>;
payment_status: string;
payment_status_label: string;
};
export type RefundStatusData = {
id: string;
refund_key: string;
status: string;
status_label: string;
amount: number;
reason: string | null;
bank_account: Array<any> | null;
transfer_notes: string | null;
transfer_evidence_url: string | null;
processed_by: string | null;
processed_at: string | null;
failure_reason: string | null;
created_at: string;
};
}
declare namespace App.Data.Customer.Payment {
export type PaymentData = {
id: string;
code: string;
name: string;
image: string | null;
fees: Array<any>;
is_active: boolean;
};
export type PaymentGroupData = {
group_type: string;
group_label: string;
payments: Array<App.Data.Customer.Payment.PaymentData>;
};
}
declare namespace App.Data.Customer.Product {
export type AddOnData = {
id: string;
name: string;
min: number;
max: number;
required: boolean;
multiple: boolean;
options: Array<App.Data.Customer.Product.OptionData>;
};
export type OptionData = {
id: string;
name: string;
price: number;
};
export type ProductData = {
id: string;
merchant_id: string;
name: string;
slug: string | null;
description: string | null;
price: number;
discount: Array<any> | null;
stock: Array<any> | null;
image: Array<any> | null;
category: Array<any> | null;
add_ons: Array<App.Data.Customer.Product.AddOnData>;
is_active: boolean;
is_po: boolean;
po_availability: Array<any> | null;
};
}
declare namespace App.Data.Customer.Review {
export type ReviewData = {
id: string;
customer: Array<any>;
rating: number;
title: string | null;
text: string | null;
status: string;
images: Array<any>;
created_at: string;
formatted_date: string;
time_ago: string;
};
}
declare namespace App.Data.Merchant.AddOn {
export type AddOnData = {
id: string;
product_id: string;
name: string;
min: number;
max: number;
options: Array<any>;
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
parent_id: string | null;
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
export type CheckoutData = {
id: string;
code: string;
merchant_id: string;
merchant: Array<any>;
customer: Array<any> | null;
order_type: string;
order_status: Array<any>;
table: Array<any> | null;
pickup_time: string | null;
payment_id: string;
payment: Array<any>;
notes: string | null;
products: Array<any>;
pricing: Array<any>;
coupons: Array<any>;
created_at: string;
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
export type OrderData = {
id: string;
code: string;
merchant: App.Data.Merchant.Auth.MerchantSummaryData;
customer: Array<any>;
payment: Array<any>;
order_type: string;
order_status: Array<any>;
payment_status: Array<any>;
notes: string | null;
products: Array<any>;
subtotal: number;
tax: Array<any> | null;
delivery_fee: Array<any> | null;
payment_fee: Array<any> | null;
total_tax_and_fee: number;
total: number;
orderable: Array<any> | null;
created_at: string;
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
export type OrderStatusData = {
id: string;
code: string;
order_status: Array<any>;
cancelled_at: string | null;
updated_at: string;
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
declare namespace App.Data.Merchant.Pos {
export type PosTableData = {
id: string;
name: string;
area_id: string;
area_name: string;
pax: number;
};
}
declare namespace App.Data.Merchant.Product {
export type ProductData = {
id: string;
merchant_id: string;
category_id: string | null;
name: string;
slug: string;
code: string | null;
description: string | null;
price: number;
cost: number | null;
stock_enabled: boolean;
stock: number;
stock_alert: number | null;
active: boolean;
image_url: string | null;
thumbnail_url: string | null;
category: Array<any> | null;
created_at: string;
updated_at: string;
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
