import type { Order } from "@/types/order";
import type {
  OrderStatus,
  PaymentStatus,
  ChargeStatus,
  CancelStatus,
  DeliveryMethod,
} from "@/types/enums";

/* =========================================================
   DB ROW TYPE
========================================================= */

export type OrderRow = {
  id: string;

  user_id: string;
  admin_id: string | null;

  quote_total_price: number | null;
  final_total_price: number | null;

  order_status: string | null;
  payment_status: string | null;
  charge_status: string | null;
  cancel_status: string | null;

  cancel_reason: string | null;
  has_customer_request: boolean | null;

  refund_amount: number | null;
  refund_reference: string | null;
  refunded_at: string | null;

  delivery_method: string | null;
  delivery_address: string | null;
  pickup_location: string | null;

  customer_name: string | null;
  phone_number: string | null;

  delivery_notes: string | null;
  admin_notes: string | null;

  order_reference_code: string | null;

  created_at: string | null;
  updated_at: string | null;
};

/* =========================================================
   SAFE ENUM CAST HELPERS
========================================================= */

function toOrderStatus(v: string | null): OrderStatus {
  return (v as OrderStatus) ?? "requested";
}

function toPaymentStatus(v: string | null): PaymentStatus {
  return (v as PaymentStatus) ?? "unpaid";
}

function toChargeStatus(v: string | null): ChargeStatus {
  return (v as ChargeStatus) ?? "none";
}

function toCancelStatus(v: string | null): CancelStatus {
  return (v as CancelStatus) ?? "none";
}

function toDeliveryMethod(v: string | null): DeliveryMethod | undefined {
  return (v as DeliveryMethod) ?? undefined;
}

/* =========================================================
   NORMALIZER
========================================================= */

export function normalizeOrderRow(row: OrderRow): Order {
  return {
    id: row.id,

    user_id: row.user_id,
    admin_id: row.admin_id ?? undefined,

    quote_total_price: row.quote_total_price ?? undefined,
    final_total_price: row.final_total_price ?? undefined,

    order_status: toOrderStatus(row.order_status),
    payment_status: toPaymentStatus(row.payment_status),
    charge_status: toChargeStatus(row.charge_status),
    cancel_status: toCancelStatus(row.cancel_status),

    cancel_reason: row.cancel_reason ?? undefined,
    has_customer_request: row.has_customer_request ?? false,

    refund_amount: row.refund_amount ?? undefined,
    refund_reference: row.refund_reference ?? undefined,
    refunded_at: row.refunded_at ?? undefined,

    delivery_method: toDeliveryMethod(row.delivery_method),
    delivery_address: row.delivery_address ?? undefined,
    pickup_location: row.pickup_location ?? undefined,

    customer_name: row.customer_name ?? undefined,
    phone_number: row.phone_number ?? undefined,

    delivery_notes: row.delivery_notes ?? undefined,
    admin_notes: row.admin_notes ?? undefined,

    order_reference_code: row.order_reference_code ?? undefined,

    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),

    order_items: [],
    order_charges: [],
    payments: [],
    conversations: [],
    order_timelines: [],
  };
}