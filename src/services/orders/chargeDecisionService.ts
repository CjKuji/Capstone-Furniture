import { supabase } from "@/lib/supabase";

/**
 * =========================================================
 * TYPES
 * =========================================================
 */

export type RejectChargesPayload = {
  orderId: string;
  userId: string;
};

export type AcceptChargesPayload = {
  orderId: string;
  userId: string;
};

export type UpdateChargeStatusPayload = {
  orderId: string;
  status: "pending" | "accepted" | "rejected";
};

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

async function getConversationId(orderId: string): Promise<string> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("Conversation not found");

  return data.id;
}

async function getChargeStatus(orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("charge_status, quote_total_price")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Order not found");

  return data;
}

async function getOrderChargesSum(orderId: string): Promise<number> {
  const { data, error } = await supabase
    .from("order_charges")
    .select("amount, is_additive")
    .eq("order_id", orderId);

  if (error) throw new Error(error.message);

  return (data ?? []).reduce((sum, c) => {
    const amount = Number(c.amount ?? 0);
    return c.is_additive ? sum + amount : sum - amount;
  }, 0);
}

/**
 * =========================================================
 * UPDATE STATUS + FINAL PRICE
 * =========================================================
 */

async function updateChargeStatus({
  orderId,
  status,
}: UpdateChargeStatusPayload) {
  let finalTotalPrice: number | null = null;

  if (status === "accepted") {
    const order = await getChargeStatus(orderId);
    const chargesTotal = await getOrderChargesSum(orderId);

    finalTotalPrice =
      Number(order.quote_total_price ?? 0) + chargesTotal;
  }

  const { data, error } = await supabase
    .from("orders")
    .update({
      charge_status: status,
      ...(finalTotalPrice !== null
        ? { final_total_price: finalTotalPrice }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Failed to update charge status");

  return data;
}

/**
 * =========================================================
 * SYSTEM MESSAGE
 * =========================================================
 */

async function sendSystemMessage({
  conversationId,
  userId,
  message,
  metadata,
}: {
  conversationId: string;
  userId: string;
  message: string;
  metadata?: any;
}) {
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,

    // ✅ FIXED: use valid enum only
    sender_type: "admin",

    sender_id: userId,
    message,

    // system flag (this is what defines automation)
    is_system: true,

    metadata,
  });

  if (error) throw new Error(error.message);
}

/**
 * =========================================================
 * ACCEPT CHARGES
 * =========================================================
 */

export async function acceptCharges(payload: AcceptChargesPayload) {
  const { orderId, userId } = payload;

  const status = await getChargeStatus(orderId);

  if (status.charge_status === "accepted") {
    throw new Error("Charges already accepted");
  }

  if (status.charge_status === "rejected") {
    throw new Error("Charges already rejected");
  }

  const updatedOrder = await updateChargeStatus({
    orderId,
    status: "accepted",
  });

  const conversationId = await getConversationId(orderId);

  await sendSystemMessage({
    conversationId,
    userId,
    message: "✅ Charges accepted",
    metadata: {
      type: "order_charge_accepted",
      orderId,
    },
  });

  return updatedOrder;
}

/**
 * =========================================================
 * REJECT CHARGES (AUTO SYSTEM CHAT EVENT)
 * =========================================================
 */

export async function rejectCharges(payload: RejectChargesPayload) {
  const { orderId, userId } = payload;

  const status = await getChargeStatus(orderId);

  if (status.charge_status === "accepted") {
    throw new Error("Charges already accepted");
  }

  if (status.charge_status === "rejected") {
    throw new Error("Charges already rejected");
  }

  const updatedOrder = await updateChargeStatus({
    orderId,
    status: "rejected",
  });

  const conversationId = await getConversationId(orderId);

  // 🚀 SYSTEM GENERATED MESSAGE (NO USER INPUT)
  await sendSystemMessage({
    conversationId,
    userId,
    message: "❌ User has rejected the charges",
    metadata: {
      type: "order_charge_rejected",
      orderId,
    },
  });

  return updatedOrder;
}