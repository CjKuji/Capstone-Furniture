import { supabase } from "@/lib/supabase";

/**
 * =========================================================
 * TYPES
 * =========================================================
 */

export type AddChargePayload = {
  orderId: string;
  adminId: string;
  type: string;
  label?: string | null;
  amount: number;
  isAdditive?: boolean;
};

export type UpdateChargePayload = {
  chargeId: string;
  adminId: string;
  type?: string;
  label?: string | null;
  amount?: number;
  isAdditive?: boolean;
};

/**
 * =========================================================
 * BASE QUOTE
 * =========================================================
 */
async function getBaseQuote(orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("quote_total_price")
    .eq("id", orderId)
    .single();

  if (error) throw new Error(error.message);

  return Number(data?.quote_total_price ?? 0);
}

/**
 * =========================================================
 * CHARGES TOTAL
 * =========================================================
 */
async function getChargesTotal(orderId: string) {
  const { data, error } = await supabase
    .from("order_charges")
    .select("amount, is_additive")
    .eq("order_id", orderId);

  if (error) throw new Error(error.message);

  return (data ?? []).reduce((sum, c) => {
    const amount = Number(c.amount ?? 0);
    return c.is_additive === false ? sum - amount : sum + amount;
  }, 0);
}

/**
 * =========================================================
 * FINAL PRICE CALCULATION
 * =========================================================
 */
async function computeFinalPrice(orderId: string) {
  const base = await getBaseQuote(orderId);
  const charges = await getChargesTotal(orderId);

  return Math.max(base + charges, 0);
}

/**
 * =========================================================
 * GET FINAL PRICE (READ ONLY)
 * =========================================================
 */
export async function getFinalOrderTotal(orderId: string) {
  return await computeFinalPrice(orderId);
}

/**
 * =========================================================
 * ADD CHARGE
 * =========================================================
 */
export async function addCharge(payload: AddChargePayload) {
  const {
    orderId,
    adminId,
    type,
    label = null,
    amount,
    isAdditive = true,
  } = payload;

  if (!orderId) throw new Error("orderId is required");
  if (!adminId) throw new Error("adminId is required");
  if (!type) throw new Error("type is required");
  if (amount < 0) throw new Error("amount must be >= 0");

  const { error } = await supabase.from("order_charges").insert({
    order_id: orderId,
    type,
    label,
    amount,
    is_additive: isAdditive,
    created_by: adminId,
  });

  if (error) throw new Error(error.message);

  return await getFinalOrderTotal(orderId);
}

/**
 * =========================================================
 * UPDATE CHARGE
 * =========================================================
 */
export async function updateCharge(payload: UpdateChargePayload) {
  const { chargeId, type, label, amount, isAdditive } = payload;

  if (!chargeId) throw new Error("chargeId is required");

  const { data: charge, error: fetchError } = await supabase
    .from("order_charges")
    .select("id, order_id")
    .eq("id", chargeId)
    .single();

  if (fetchError || !charge) {
    throw new Error("Charge not found");
  }

  const { error } = await supabase
    .from("order_charges")
    .update({
      ...(type !== undefined && { type }),
      ...(label !== undefined && { label }),
      ...(amount !== undefined && { amount }),
      ...(isAdditive !== undefined && { is_additive: isAdditive }),
    })
    .eq("id", chargeId);

  if (error) throw new Error(error.message);

  return await getFinalOrderTotal(charge.order_id);
}

/**
 * =========================================================
 * DELETE CHARGE
 * =========================================================
 */
export async function deleteCharge(chargeId: string) {
  if (!chargeId) throw new Error("chargeId is required");

  const { data: charge, error: fetchError } = await supabase
    .from("order_charges")
    .select("id, order_id")
    .eq("id", chargeId)
    .single();

  if (fetchError || !charge) {
    throw new Error("Charge not found");
  }

  const { error } = await supabase
    .from("order_charges")
    .delete()
    .eq("id", chargeId);

  if (error) throw new Error(error.message);

  return await getFinalOrderTotal(charge.order_id);
}

/**
 * =========================================================
 * GET ORDER CHARGES
 * =========================================================
 */
export async function getOrderCharges(orderId: string) {
  if (!orderId) throw new Error("orderId is required");

  const { data, error } = await supabase
    .from("order_charges")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data ?? [];
}

/**
 * =========================================================
 * FINALIZE ORDER PRICING (FIXED CORE LOGIC)
 * =========================================================
 */
export async function finalizeOrderCharges({
  orderId,
  adminId,
}: {
  orderId: string;
  adminId: string;
}) {
  if (!orderId) throw new Error("orderId is required");
  if (!adminId) throw new Error("adminId is required");

  /**
   * CHECK CHARGES
   */
  const { data: charges, error } = await supabase
    .from("order_charges")
    .select("id")
    .eq("order_id", orderId);

  if (error) throw new Error(error.message);

  const hasCharges = (charges ?? []).length > 0;

  /**
   * CASE 1: NO CHARGES → AUTO FINALIZE PRICE
   */
  if (!hasCharges) {
    const final = await computeFinalPrice(orderId);

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        charge_status: "accepted",
        final_total_price: final,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) throw new Error(updateError.message);

    return {
      orderId,
      chargeStatus: "accepted",
      finalTotal: final,
      hasCharges: false,
    };
  }

  /**
   * CASE 2: HAS CHARGES → WAIT FOR ADMIN REVIEW
   */
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      charge_status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateError) throw new Error(updateError.message);

  return {
    orderId,
    chargeStatus: "pending",
    hasCharges: true,
  };
}