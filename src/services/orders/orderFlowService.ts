import { supabase } from "@/lib/supabase";
import type { OrderStatus } from "@/types/enums";

/**
 * =========================================================
 * INTERNAL HELPER
 * =========================================================
 */
async function getOrder(orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_status, delivery_method, payment_status")
    .eq("id", orderId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
) {
  const { data, error } = await supabase
    .from("orders")
    .update({
      order_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * =========================================================
 * ACCEPT ORDER
 * =========================================================
 */
export async function acceptOrder(params: {
  orderId: string;
  adminId: string;
}) {
  const { orderId, adminId } = params;

  if (!orderId) throw new Error("orderId is required");
  if (!adminId) throw new Error("adminId is required");

  const order = await getOrder(orderId);

  if (order.order_status !== "requested") {
    throw new Error("Only requested orders can be accepted");
  }

  return updateOrderStatus(orderId, "accepted");
}

/**
 * =========================================================
 * START PRODUCTION (FIXED)
 * =========================================================
 */
export async function startProduction(orderId: string) {
  const order = await getOrder(orderId);

  // ✅ MUST be accepted
  if (order.order_status !== "accepted") {
    throw new Error("Order must be accepted before starting production");
  }

  // ✅ MUST be partially or fully paid
  if (
    order.payment_status !== "partially_paid" &&
    order.payment_status !== "fully_paid"
  ) {
    throw new Error(
      "Cannot start production: requires partial or full payment"
    );
  }

  return updateOrderStatus(orderId, "in_production");
}

/**
 * =========================================================
 * MARK READY (BRANCH BASED ON DELIVERY METHOD)
 * =========================================================
 */
export async function markOrderReady(orderId: string) {
  const order = await getOrder(orderId);

  if (order.order_status !== "in_production") {
    throw new Error("Order must be in production");
  }

  if (order.delivery_method === "pickup") {
    return updateOrderStatus(orderId, "ready_for_pickup");
  }

  return updateOrderStatus(orderId, "ready_for_shipment");
}

/**
 * =========================================================
 * DISPATCH ORDER
 * =========================================================
 */
export async function dispatchOrder(orderId: string) {
  const order = await getOrder(orderId);

  if (order.delivery_method === "pickup") {
    throw new Error("Pickup orders cannot be dispatched");
  }

  if (order.order_status !== "ready_for_shipment") {
    throw new Error("Order not ready for shipment");
  }

  return updateOrderStatus(orderId, "shipped");
}

/**
 * =========================================================
 * COMPLETE ORDER
 * =========================================================
 */
export async function completeOrder(orderId: string) {
  const order = await getOrder(orderId);

  // PICKUP FLOW
  if (order.delivery_method === "pickup") {
    if (order.order_status !== "ready_for_pickup") {
      throw new Error("Order not ready for pickup completion");
    }

    return updateOrderStatus(orderId, "completed");
  }

  // DELIVERY FLOW
  if (order.delivery_method === "delivery") {
    if (order.order_status !== "shipped") {
      throw new Error("Order must be shipped before completion");
    }

    return updateOrderStatus(orderId, "completed");
  }

  throw new Error("Invalid delivery method");
}

/**
 * =========================================================
 * ADD ORDER CHARGE
 * =========================================================
 */
export async function addOrderCharge(params: {
  orderId: string;
  type: string;
  label?: string;
  amount: number;
  isAdditive?: boolean;
  createdBy: string;
}) {
  const {
    orderId,
    type,
    label,
    amount,
    isAdditive = true,
    createdBy,
  } = params;

  if (!orderId) throw new Error("orderId is required");
  if (!type) throw new Error("type is required");
  if (amount === undefined || amount === null)
    throw new Error("amount is required");
  if (!createdBy) throw new Error("createdBy is required");

  const { data, error } = await supabase
    .from("order_charges")
    .insert({
      order_id: orderId,
      type,
      label: label ?? null,
      amount,
      is_additive: isAdditive,
      created_by: createdBy,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  await recalculateOrderTotal(orderId);

  return data;
}

/**
 * =========================================================
 * RECALCULATE TOTAL
 * =========================================================
 */
export async function recalculateOrderTotal(orderId: string) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("quote_total_price")
    .eq("id", orderId)
    .single();

  if (orderError) throw new Error(orderError.message);

  const { data: charges, error: chargesError } = await supabase
    .from("order_charges")
    .select("amount, is_additive")
    .eq("order_id", orderId);

  if (chargesError) throw new Error(chargesError.message);

  const totalCharges = (charges ?? []).reduce((sum, c) => {
    return c.is_additive
      ? sum + Number(c.amount)
      : sum - Number(c.amount);
  }, 0);

  const base = Number(order.quote_total_price ?? 0);
  const finalTotal = base + totalCharges;

  await supabase
    .from("orders")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  return {
    base,
    totalCharges,
    finalTotal,
  };
}