/**
 * Auto-generated request types from Scramble OpenAPI spec (merchant).
 * Source of truth: app/Http/Requests/Api/V0/ Form Request rules().
 *
 * Regenerate: npm run api:merchant
 * Do not edit manually.
 */
declare namespace App.Requests.Merchant {
    export type CancellationRequestStatusEnum = "pending" | "approved" | "rejected";
    export type GalleryCategoryEnum = "Food" | "Ambiance";
    export type ReviewStatusEnum = "approved" | "unapproved";
    export type UnitTypeEnum = "percentage" | "fixed";
    export type UserRoleEnum = "owner" | "manager" | "cashier" | "waiter" | "chef";
}
declare namespace App.Requests.Merchant.AddOn {
    export type StoreAddOnRequest = {
        name: string;
        min: number;
        max: number;
        options: {
            name: string;
            price: number;
        }[];
    };
    export type UpdateAddOnRequest = {
        name?: string;
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
    export type StoreCategoryRequest = {
        name: string;
        slug?: string | null;
        parent_id?: string | null;
        description?: string | null;
        position?: number | null;
        active?: boolean;
    };
    export type UpdateCategoryRequest = {
        name?: string;
        slug?: string | null;
        parent_id?: string | null;
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
        customer_type: "guest" | "customer" | "anonymous";
        guest_id?: string | null;
        customer_id?: string | null;
        order_type: "dine-in" | "takeaway";
        table_id?: string | null;
        pickup_time?: string | null;
        payment_id: string;
        notes?: string | null;
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
        guest?: {
            name?: string;
            email?: string | null;
            phone?: string | null;
        };
        coupon_codes?: string[] | null;
    };
}
declare namespace App.Requests.Merchant.Coupon {
    export type StoreCouponRequest = {
        code: string;
        unit: App.Requests.Merchant.UnitTypeEnum;
        value: number;
        type: "order" | "product" | "shipping";
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
        type?: "order" | "product" | "shipping";
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
declare namespace App.Requests.Merchant.Order {
    export type UpdateOrderStatusRequest = {
        status: "new" | "process" | "completed" | "rejected";
        reason?: string | null;
    };
}
declare namespace App.Requests.Merchant.Product {
    export type StoreProductRequest = {
        name: string;
        code: string;
        category_id: string;
        description?: string | null;
        price: number;
        stock_enabled?: boolean;
        stock?: number | null;
        stock_alert?: number | null;
        active?: boolean;
        image?: string | null;
    };
    export type UpdateProductRequest = {
        name?: string;
        code?: string;
        category_id?: string;
        description?: string | null;
        price?: number;
        stock_enabled?: boolean;
        stock?: number | null;
        stock_alert?: number | null;
        active?: boolean;
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
        auto_process_on_payment_settlement?: boolean;
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
