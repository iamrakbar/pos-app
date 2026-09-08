/**
 * Auto-generated request types from Scramble OpenAPI spec (merchant).
 * Source of truth: app/Http/Requests/Api/V0/ Form Request rules().
 *
 * Regenerate: npm run api:merchant
 * Do not edit manually.
 */
declare namespace App.Requests.Merchant {
    export type StoreDeviceTokenRequest = {
        token: string;
        platform: "android" | "ios" | "web";
        app_version?: string | null;
    };
    export type CancellationRequestStatusEnum = "pending" | "approved" | "rejected";
    export type GalleryCategoryEnum = "Food" | "Ambiance";
    export type InventoryModeEnum = "unlimited" | "manual" | "recipe";
    export type InventoryMovementTypeEnum = "opening" | "purchase" | "sale" | "reversal" | "adjustment" | "waste" | "damage" | "return";
    export type InventoryOperationStatusEnum = "processing" | "posted" | "reversed" | "failed";
    export type InventoryUnitEnum = "gram" | "kilogram" | "milliliter" | "liter" | "piece" | "serving";
    export type KitchenTicketStatusActionEnum = "start" | "ready" | "cancel";
    export type KitchenTicketStatusEnum = "queued" | "preparing" | "ready" | "cancelled";
    export type OrderStatusEnum = "open" | "completed" | "cancelled";
    export type OrderTypeEnum = "dine-in" | "takeaway" | "delivery";
    export type PaymentGroupEnum = "cash" | "card" | "bank_transfer" | "qris" | "e_wallet" | "food_delivery" | "marketplace" | "over_the_counter";
    export type PaymentStatusEnum = "capture" | "settlement" | "pending" | "deny" | "expire" | "cancel" | "failure";
    export type ReviewStatusEnum = "approved" | "unapproved";
    export type UnitTypeEnum = "percentage" | "fixed";
    export type UserRoleEnum = "owner" | "manager" | "cashier" | "waiter" | "chef";
}
declare namespace App.Requests.Merchant.AddOn {
    export type StoreAddOnRequest = {
        name: string;
        required: boolean;
        multiple: boolean;
        min: number;
        max: number;
        options: {
            name: string;
            price: number;
        }[];
    };
    export type UpdateAddOnRequest = {
        name?: string;
        required?: boolean;
        multiple?: boolean;
        min?: number;
        max?: number;
        options?: {
            id?: string | null;
            name: string;
            price: number;
            _destroy?: boolean | null;
        }[];
    };
}
declare namespace App.Requests.Merchant.Area {
    export type StoreAreaRequest = {
        name: string;
    };
    export type StoreTableRequest = {
        name: string;
        pax?: number | null;
        active?: boolean;
    };
    export type UpdateAreaRequest = {
        name: string;
    };
    export type UpdateTableRequest = {
        name: string;
        pax?: number | null;
        active?: boolean;
    };
}
declare namespace App.Requests.Merchant.Auth {
    export type LoginRequest = {
        email: string;
        password: string;
    };
    export type UpdateProfileRequest = {
        name?: string;
    };
}
declare namespace App.Requests.Merchant.Cancellation {
    export type DecideCancellationRequest = {
        decision: "approve" | "reject";
        note?: string | null;
        reason?: string | null;
    };
}
declare namespace App.Requests.Merchant.Category {
    export type ReorderCategoryRequest = {
        categories: {
            id: string;
            position: number;
        }[];
    };
    export type StoreCategoryRequest = {
        name: string;
        slug?: string | null;
        description?: string | null;
        position?: number | null;
        active?: boolean;
    };
    export type UpdateCategoryRequest = {
        name?: string;
        slug?: string | null;
        description?: string | null;
        position?: number | null;
        active?: boolean;
    };
}
declare namespace App.Requests.Merchant.Checkout {
    export type CartValidateRequest = {
        products: {
            id: string;
            product_id: string;
            name: string;
            qty: number;
            price: number;
            subtotal: number;
            notes?: string | null;
            add_ons?: {
                id: string;
                name: string;
                options?: {
                    id: string;
                    name: string;
                    price: number;
                }[] | null;
            }[] | null;
        }[];
        coupon_codes?: string[] | null;
    };
    export type CheckoutRequest = {
        products: {
            id: string;
            product_id: string;
            name: string;
            qty: number;
            price: number;
            subtotal: number;
            notes?: string | null;
            add_ons?: {
                id: string;
                name: string;
                options?: {
                    id: string;
                    name: string;
                    price: number;
                }[] | null;
            }[] | null;
        }[];
        customer_type: "guest" | "customer" | "anonymous";
        guest_id?: string | null;
        guest?: {
            name?: string;
            email?: string | null;
            phone?: string | null;
        };
        customer_id?: string | null;
        order_type: "dine-in" | "takeaway";
        table_id?: string | null;
        pickup_time?: string | null;
        payment_id: string;
        tender_value?: string | null;
        notes?: string | null;
        coupon_codes?: string[] | null;
    };
}
declare namespace App.Requests.Merchant.Coupon {
    export type StoreCouponRequest = {
        code: string;
        unit: App.Requests.Merchant.UnitTypeEnum;
        value: number;
        type: "order";
        start_date?: string | null;
        end_date?: string | null;
        limit_per_user: number;
        limit_quota?: number | null;
        active?: boolean;
        rules?: string[] | null;
    };
    export type UpdateCouponRequest = {
        code?: string;
        unit?: App.Requests.Merchant.UnitTypeEnum;
        value?: number;
        type?: "order";
        start_date?: string | null;
        end_date?: string | null;
        limit_per_user?: number;
        limit_quota?: number | null;
        active?: boolean;
        rules?: string[] | null;
    };
}
declare namespace App.Requests.Merchant.Delivery {
    export type SubmitWaybillRequest = {
        waybill_id: string;
        courier_code: string;
    };
}
declare namespace App.Requests.Merchant.Discount {
    export type StoreDiscountRequest = {
        name: string;
        unit: App.Requests.Merchant.UnitTypeEnum;
        value: number;
        start?: string | null;
        end?: string | null;
        active?: boolean;
        products?: string[] | null;
    };
    export type UpdateDiscountRequest = {
        name?: string | null;
        unit?: App.Requests.Merchant.UnitTypeEnum;
        value?: number;
        start?: string | null;
        end?: string | null;
        active?: boolean;
        products?: string[] | null;
    };
}
declare namespace App.Requests.Merchant.Finance {
    export type StoreBeneficiaryRequest = {
        disbursement_id: string;
        account_number: string;
        account_holder?: string | null;
        is_default?: boolean;
    };
    export type StorePayoutRequest = {
        beneficiary_id: string;
        amount: number;
        notes?: string | null;
    };
    export type ValidateBeneficiaryRequest = {
        disbursement_id: string;
        account_number: string;
    };
}
declare namespace App.Requests.Merchant.Gallery {
    export type StoreGalleryRequest = {
        name: string;
        category: App.Requests.Merchant.GalleryCategoryEnum;
        active?: boolean;
        image?: string | null;
    };
    export type UpdateGalleryRequest = {
        name?: string;
        category?: App.Requests.Merchant.GalleryCategoryEnum;
        active?: boolean;
        image?: string | null;
    };
}
declare namespace App.Requests.Merchant.Guest {
    export type StoreGuestRequest = {
        name: string;
        email?: string | null;
        phone?: string | null;
    };
}
declare namespace App.Requests.Merchant.Ingredient {
    export type MovementRequest = {
        type: "purchase" | "return" | "waste" | "damage";
        quantity: number;
        reason: string;
        cost_per_unit?: number | null;
        supplier_offer_id?: number | null;
        operation_id: string;
    };
    export type StoreIngredientRequest = {
        name: string;
        base_unit: App.Requests.Merchant.InventoryUnitEnum;
        reorder_point?: number;
        cost_per_unit?: number | null;
        active?: boolean;
        initial_quantity?: number | null;
        operation_id?: string;
    };
    export type UpdateIngredientRequest = {
        name?: string;
        base_unit?: App.Requests.Merchant.InventoryUnitEnum;
        reorder_point?: number;
        cost_per_unit?: number | null;
        active?: boolean;
    };
}
declare namespace App.Requests.Merchant.Inventory {
    export type AdjustmentRequest = {
        target_balance: number;
        reason: string;
        operation_id: string;
    };
    export type OpeningBalanceRequest = {
        quantity: number;
        cost_per_unit?: number | null;
        operation_id: string;
    };
}
declare namespace App.Requests.Merchant.Order {
    export type UpdateKitchenTicketStatusRequest = {
        status: App.Requests.Merchant.KitchenTicketStatusActionEnum;
    };
    export type UpdateOrderStatusRequest = {
        status: "completed" | "cancelled";
        reason?: string | null;
    };
}
declare namespace App.Requests.Merchant.Payment {
    export type UpdateMerchantPaymentRequest = {
        active: boolean;
        sort?: number;
        display_name?: string | null;
    };
}
declare namespace App.Requests.Merchant.Product {
    export type StoreProductRequest = {
        name: string;
        code?: string | null;
        category_id: string;
        description?: string | null;
        price: number;
        stock?: number | null;
        stock_alert?: number | null;
        active?: boolean;
        image?: string | null;
        add_ons?: {
            name: string;
            required: boolean;
            multiple: boolean;
            min: number;
            max: number;
            options: {
                name: string;
                price: number;
            }[];
        }[];
    };
    export type UpdateInventoryRequest = {
        inventory_mode?: App.Requests.Merchant.InventoryModeEnum;
        cost?: number | null;
        stock_alert?: number | null;
    };
    export type UpdateProductRequest = {
        name?: string;
        code?: string | null;
        category_id?: string;
        description?: string | null;
        price?: number;
        stock_alert?: number | null;
        active?: boolean;
    };
    export type UpdateRecipeRequest = {
        ingredients: {
            ingredient_id: string;
            quantity: number;
            unit: App.Requests.Merchant.InventoryUnitEnum;
        }[];
    };
    export type UploadProductImageRequest = {
        image: string;
    };
}
declare namespace App.Requests.Merchant.Profile {
    export type UpdateMerchantProfileRequest = {
        name?: string;
        description?: string | null;
        phone?: string | null;
        email?: string | null;
        website?: string | null;
        terms?: string | null;
        dine_in?: boolean;
        takeaway?: boolean;
        delivery?: boolean;
        tax_is_enable?: boolean;
        tax_name?: string | null;
        tax_value?: number | null;
        charge_app_payment_fee_to_customer?: boolean;
        schedule?: {
            day_of_week: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
            open_time: string;
            close_time: string;
        }[];
        address?: {
            address?: string | null;
            province?: string | null;
            city?: string | null;
            district?: string | null;
            village?: string | null;
            postcode?: string | null;
            lat?: number | null;
            lng?: number | null;
        };
    };
    export type UploadMerchantImageRequest = {
        image: string;
    };
}
declare namespace App.Requests.Merchant.Review {
    export type UpdateReviewStatusRequest = {
        status: App.Requests.Merchant.ReviewStatusEnum;
    };
}
declare namespace App.Requests.Merchant.Staff {
    export type StoreStaffRequest = {
        name: string;
        email: string;
        phone?: string | null;
        role: App.Requests.Merchant.UserRoleEnum;
        password: string;
    };
    export type UpdateStaffRequest = {
        name?: string;
        email?: string;
        phone?: string | null;
        role?: App.Requests.Merchant.UserRoleEnum;
        password?: string | null;
    };
}
declare namespace App.Requests.Merchant.Subscription {
    export type SubscribeRequest = {
        plan_key: "trial" | "monthly" | "semesterly" | "yearly";
    };
}
declare namespace App.Requests.Merchant.Supplier {
    export type OfferRequest = {
        supplier_id: string;
        supplier_sku?: string | null;
        purchase_unit: string;
        pack_quantity: number;
        minimum_order_quantity?: number | null;
        last_purchase_price?: number | null;
        lead_time_days?: number | null;
        is_preferred?: boolean;
        active?: boolean;
    };
    export type StoreSupplierRequest = {
        name: string;
        contact_name?: string | null;
        email?: string | null;
        phone?: string | null;
        lead_time_days?: number | null;
        payment_terms?: string | null;
        active?: boolean;
    };
    export type UpdateSupplierRequest = {
        name?: string;
        contact_name?: string | null;
        email?: string | null;
        phone?: string | null;
        lead_time_days?: number | null;
        payment_terms?: string | null;
        active?: boolean;
    };
}
