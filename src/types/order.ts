import type {
  OrderStatus,
  DeliveryMethod,
  PaymentStatus,
  SenderType,
  ChargeStatus,
  CancelStatus,
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
  SenderType,
  ChargeStatus,
  CancelStatus,
};

/**
 * =========================================================
 * PAYMENT
 * =========================================================
 */
export type Payment = {
  id: string;
  order_id: string;
  user_id: string;

  amount: number;
  currency: string;
  provider: string;

  status:
    | "pending"
    | "processing"
    | "paid"
    | "failed"
    | "expired"
    | "cancelled"
    | "refunded";

  checkout_url?: string;
  checkout_session_id?: string;
  payment_intent_id?: string;
  payment_method_id?: string;
  external_reference?: string;

  created_at: string;
  updated_at?: string;
  paid_at?: string;
  failure_reason?: string;
};

/**
 * =========================================================
 * SNAPSHOTS
 * =========================================================
 */
export type FurnitureSnapshot = {
  id: string;
  name?: string;
  description?: string;
  category?: string;

  base_price?: number;
  model_url?: string;

  width_cm?: number;
  depth_cm?: number;
  height_cm?: number;

  images?: {
    url: string;
    isPrimary?: boolean;
  }[];
};

export type VariantSnapshot = {
  id: string;
  name?: string;
  texture_url?: string;
  preview_image_url?: string;
  price_adjustment?: number;
};

/**
 * =========================================================
 * ORDER ITEM
 * =========================================================
 */
export type OrderItem = {
  id: string;
  order_id: string;
  furniture_id: string;
  selected_variant_id?: string;

  quantity: number;
  unit_price: number;
  total_price: number;

  furniture_snapshot?: FurnitureSnapshot;
  variant_snapshot?: VariantSnapshot;

  model_snapshot_url?: string;

  created_at: string;
};

/**
 * =========================================================
 * ORDER CHARGE
 * =========================================================
 */
export type OrderCharge = {
  id: string;
  order_id: string;

  type: string;
  label?: string;

  amount: number;
  is_additive: boolean;

  created_by?: string;
  created_at: string;
};

/**
 * =========================================================
 * DELIVERY
 * =========================================================
 */
export type DeliveryInfo = {
  method?: DeliveryMethod;
  delivery_address?: string;
  pickup_location?: string;
};

/**
 * =========================================================
 * MESSAGE
 * =========================================================
 */
export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;

  sender_type: SenderType;

  message?: string;
  image_url?: string;

  is_system: boolean;
  metadata?: Record<string, any>;

  created_at: string;
};

/**
 * =========================================================
 * CONVERSATION
 * =========================================================
 */
export type Conversation = {
  id: string;
  user_id: string;
  admin_id: string;

  order_id?: string;

  created_at: string;
  updated_at: string;

  customer_unread_count: number;
  admin_unread_count: number;

  customer_last_read_at?: string;
  admin_last_read_at?: string;

  last_message?: string;
  last_message_at?: string;

  messages: Message[];
};

/**
 * =========================================================
 * ORDER (UI / HYDRATED MODEL - CLEAN)
 * =========================================================
 */
export type Order = {
  id: string;

  user_id: string;
  admin_id?: string;

  quote_total_price?: number;
  final_total_price?: number;

  order_status: OrderStatus;
  payment_status: PaymentStatus;
  charge_status: ChargeStatus;
  cancel_status: CancelStatus;

  cancel_reason?: string;
  has_customer_request: boolean;

  refund_amount?: number;
  refund_reference?: string;
  refunded_at?: string;

  delivery_method?: DeliveryMethod;
  delivery_address?: string;
  pickup_location?: string;

  customer_name?: string;
  phone_number?: string;

  delivery_notes?: string;
  admin_notes?: string;

  order_reference_code?: string;

  created_at: string;
  updated_at: string;

  order_items: OrderItem[];
  order_charges: OrderCharge[];
  payments: Payment[];
  conversations: Conversation[];

  order_timelines: {
    id: string;
    title: string;
    description?: string;
    metadata?: Record<string, any>;
    created_at: string;
  }[];
};

/**
 * =========================================================
 * 🔥 ORDER ROW (SUPABASE RAW OUTPUT - FIXED NULL SAFETY)
 * =========================================================
 */
export type OrderRow = {
  id: string;

  user_id: string;
  admin_id: string | null;

  quote_total_price: number | null;
  final_total_price: number | null;

  order_status: OrderStatus | null;
  payment_status: PaymentStatus | null;
  charge_status: ChargeStatus | null;
  cancel_status: CancelStatus | null;

  cancel_reason: string | null;
  admin_notes: string | null;

  has_customer_request: boolean | null;

  refund_amount: number | null;
  refund_reference: string | null;
  refunded_at: string | null;

  delivery_method: DeliveryMethod | null;
  delivery_address: string | null;
  pickup_location: string | null;

  customer_name: string | null;
  phone_number: string | null;

  delivery_notes: string | null;

  order_reference_code: string | null;

  created_at: string | null;
  updated_at: string | null;
};

/**
 * =========================================================
 * CREATE ORDER
 * =========================================================
 */
export type CreateOrderPayload = {
  items: {
    furniture_id: string;
    variant_id?: string;
    quantity: number;
  }[];

  delivery_method: DeliveryMethod;

  customer_name?: string;
  phone_number?: string;
  delivery_address?: string;
  pickup_location?: string;
  delivery_notes?: string;
};

/**
 * =========================================================
 * ADMIN
 * =========================================================
 */
export type OrderAdmin = Order & {
  user?: import("@/types/user").Profile;
};