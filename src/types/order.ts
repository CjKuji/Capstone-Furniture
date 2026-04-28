import type {
  OrderStatus,
  DeliveryMethod,
  PaymentStatus,
  FulfillmentStatus,
} from "./enums";

/**
 * =========================================================
 * RE-EXPORT ENUMS
 * =========================================================
 */
export type {
  OrderStatus,
  DeliveryMethod,
  PaymentStatus,
  FulfillmentStatus,
};

/**
 * =========================================================
 * ORDER ITEM (SNAPSHOT-BASED - SUPABASE ALIGNED)
 * =========================================================
 */
export type OrderItem = {
  id: string;

  order_id: string;

  furniture_id: string;
  selected_variant_id: string | null;

  quantity: number;

  unit_price: number;
  total_price: number;

  /**
   * =========================================================
   * SNAPSHOT DATA
   * =========================================================
   */
  furniture_snapshot: {
    id?: string;
    name?: string;

    description?: string | null;
    category?: string | null;

    base_price?: number | null;

    model_url?: string | null;

    width_cm?: number | null;
    depth_cm?: number | null;
    height_cm?: number | null;

    images?: {
      url: string;
      isPrimary?: boolean;
    }[];
  } | null;

  variant_snapshot: {
    id?: string;
    name?: string;

    texture_url?: string | null;
    preview_image_url?: string | null;

    price_adjustment?: number | null;
  } | null;

  model_snapshot_url: string | null;

  created_at: string;
};

/**
 * =========================================================
 * DELIVERY INFO (NORMALIZED MODEL)
 * =========================================================
 */
export type DeliveryInfo = {
  method: DeliveryMethod | null;

  delivery_address?: string | null;
  pickup_location?: string | null;
};

/**
 * =========================================================
 * ORDER ENTITY (MAIN SOURCE OF TRUTH)
 * =========================================================
 */
export type Order = {
  id: string;

  user_id: string;

  quote_total_price: number | null;

  status: OrderStatus;

  /**
   * =========================================================
   * PAYMENT + FULFILLMENT (FIXED MISSING FIELDS)
   * =========================================================
   */
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;

  /**
   * =========================================================
   * DELIVERY
   * =========================================================
   */
  delivery_method: DeliveryMethod | null;

  delivery_address: string | null;
  pickup_location: string | null;

  customer_name: string | null;
  phone_number: string | null;

  delivery_notes: string | null;
  admin_notes: string | null;

  order_reference_code: string | null;

  price_breakdown: Record<string, any> | null;

  created_at: string;
  updated_at: string;

  /**
   * =========================================================
   * RELATIONS
   * =========================================================
   */
  order_items?: OrderItem[];

  order_timelines?: {
    id: string;
    title: string;
    description: string | null;
    metadata: Record<string, any> | null;
    created_at: string;
  }[];

  conversations?: {
    id: string;
  }[];
};

/**
 * =========================================================
 * CREATE ORDER PAYLOAD
 * =========================================================
 */
export type CreateOrderPayload = {
  furniture_id: string;
  variant_id: string | null;

  delivery_method: DeliveryMethod;

  customer_name?: string | null;
  phone_number?: string | null;

  delivery_address?: string | null;
  pickup_location?: string | null;

  delivery_notes?: string | null;
};

/**
 * =========================================================
 * ADMIN VIEW (EXTENDED)
 * =========================================================
 */
export type OrderAdmin = Order & {
  user?: import("@/types/user").Profile;
};