import { supabase } from "@/lib/supabase";
import type { Order } from "@/types/order";

/**
 * =========================================================
 * TYPES
 * =========================================================
 */

export type RequestCancelOrderParams = {
  orderId: string;
  userId: string;
  reason: string;
};

export type ApproveCancelOrderParams = {
  orderId: string;
  adminId: string;
};

export type RejectCancelOrderParams = {
  orderId: string;
  adminId: string;
  reason?: string;
};

export type CancelOrderResult = {
  success: boolean;
  mode: "instant" | "request";
};

export type CancelReviewResult = {
  success: boolean;
};

/**
 * =========================================================
 * BLOCKED STATUSES
 * =========================================================
 */

const BLOCKED_STATUSES = [
  "cancelled",
  "shipped",
  "in_transit",
  "completed",
] as const;

type BlockedStatus =
  (typeof BLOCKED_STATUSES)[number];

/**
 * =========================================================
 * CHECK IF CANCEL IS POSSIBLE
 * =========================================================
 */

function canCancel(order: Order): boolean {
  return !BLOCKED_STATUSES.includes(
    order.order_status as BlockedStatus
  );
}

/**
 * =========================================================
 * INSTANT CANCEL RULE
 * =========================================================
 *
 * INSTANT:
 * - requested
 * - accepted + unpaid
 *
 * REVIEW REQUIRED:
 * - accepted + partially_paid
 * - accepted + fully_paid
 * - in_production
 * - ready_for_pickup
 * - etc
 * =========================================================
 */

function canInstantCancel(order: Order): boolean {
  const isRequested =
    order.order_status === "requested";

  const isAcceptedUnpaid =
    order.order_status === "accepted" &&
    order.payment_status === "unpaid";

  return isRequested || isAcceptedUnpaid;
}

/**
 * =========================================================
 * GET CONVERSATION ID
 * =========================================================
 */

async function getConversationId(
  orderId: string
): Promise<string | null> {
  const { data, error } = await (supabase
    .from("conversations") as any)
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) {
    console.error(
      "[CANCEL SERVICE] Failed to fetch conversation",
      error
    );

    return null;
  }

  return data?.id ?? null;
}

/**
 * =========================================================
 * SEND SYSTEM MESSAGE
 * =========================================================
 */

async function sendSystemMessage(params: {
  conversationId?: string | null;
  senderId: string;
  senderType: "customer" | "admin";
  message: string;
}) {
  const {
    conversationId,
    senderId,
    senderType,
    message,
  } = params;

  if (!conversationId) return;

  const { error } = await (supabase
    .from("messages") as any)
    .insert([
      {
        conversation_id: conversationId,
        sender_id: senderId,
        sender_type: senderType,
        is_system: true,
        message,
      },
    ]);

  if (error) {
    console.error(
      "[CANCEL SERVICE] Failed to send message",
      error
    );
  }
}

/**
 * =========================================================
 * USER: REQUEST / CANCEL ORDER
 * =========================================================
 */

export async function requestCancelOrder(
  params: RequestCancelOrderParams
): Promise<CancelOrderResult> {
  const { orderId, userId, reason } = params;

  const trimmedReason = reason.trim();

  const { data: order, error } = await (supabase
    .from("orders") as any)
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    throw new Error("Order not found");
  }

  const typedOrder = order as Order;

  /**
   * =========================================================
   * SECURITY
   * =========================================================
   */

  if (typedOrder.user_id !== userId) {
    throw new Error("Unauthorized");
  }

  /**
   * =========================================================
   * BLOCKED
   * =========================================================
   */

  if (!canCancel(typedOrder)) {
    throw new Error(
      "Cancellation is no longer allowed"
    );
  }

  /**
   * =========================================================
   * ALREADY REQUESTED
   * =========================================================
   */

  if (typedOrder.cancel_status === "requested") {
    throw new Error(
      "Cancellation request already submitted"
    );
  }

  const conversationId =
    await getConversationId(orderId);

  /**
   * =========================================================
   * INSTANT CANCEL
   * =========================================================
   */

  if (canInstantCancel(typedOrder)) {
    const { error: updateError } =
      await (supabase
        .from("orders") as any)
        .update({
          order_status: "cancelled",
          cancel_status: "approved",
          cancel_reason: trimmedReason,
          has_customer_request: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

    if (updateError) {
      throw updateError;
    }

    /**
     * SYSTEM MESSAGE
     */

    await sendSystemMessage({
      conversationId,
      senderId: userId,
      senderType: "customer",
      message:
        "🚫 Order cancelled instantly by customer.",
    });

    /**
     * CUSTOMER REASON
     */

    await sendSystemMessage({
      conversationId,
      senderId: userId,
      senderType: "customer",
      message: `Reason: ${trimmedReason}`,
    });

    return {
      success: true,
      mode: "instant",
    };
  }

  /**
   * =========================================================
   * REQUEST CANCEL (ADMIN REVIEW)
   * =========================================================
   */

  const { error: requestError } =
    await (supabase
      .from("orders") as any)
      .update({
        cancel_status: "requested",
        cancel_reason: trimmedReason,
        has_customer_request: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

  if (requestError) {
    throw requestError;
  }

  /**
   * SYSTEM MESSAGE
   */

  await sendSystemMessage({
    conversationId,
    senderId: userId,
    senderType: "customer",
    message:
      "⚠️ Customer requested order cancellation. Admin review required.",
  });

  /**
   * CUSTOMER REASON
   */

  await sendSystemMessage({
    conversationId,
    senderId: userId,
    senderType: "customer",
    message: `Reason: ${trimmedReason}`,
  });

  return {
    success: true,
    mode: "request",
  };
}

/**
 * =========================================================
 * ADMIN: APPROVE CANCEL
 * =========================================================
 */

export async function approveCancelOrder(
  params: ApproveCancelOrderParams
): Promise<CancelReviewResult> {
  const { orderId, adminId } = params;

  const { data: order, error } = await (supabase
    .from("orders") as any)
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    throw new Error("Order not found");
  }

  const typedOrder = order as Order;

  if (typedOrder.cancel_status !== "requested") {
    throw new Error(
      "No cancellation request found"
    );
  }

  const { error: updateError } =
    await (supabase
      .from("orders") as any)
      .update({
        order_status: "cancelled",
        cancel_status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

  if (updateError) {
    throw updateError;
  }

  const conversationId =
    await getConversationId(orderId);

  /**
   * SYSTEM MESSAGE
   */

  await sendSystemMessage({
    conversationId,
    senderId: adminId,
    senderType: "admin",
    message:
      "✅ Admin approved the cancellation request.",
  });

  return {
    success: true,
  };
}

/**
 * =========================================================
 * ADMIN: REJECT CANCEL
 * =========================================================
 */

export async function rejectCancelOrder(
  params: RejectCancelOrderParams
): Promise<CancelReviewResult> {
  const { orderId, adminId, reason } = params;

  const { data: order, error } = await (supabase
    .from("orders") as any)
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    throw new Error("Order not found");
  }

  const typedOrder = order as Order;

  if (typedOrder.cancel_status !== "requested") {
    throw new Error(
      "No cancellation request found"
    );
  }

  const { error: updateError } =
    await (supabase
      .from("orders") as any)
      .update({
        cancel_status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

  if (updateError) {
    throw updateError;
  }

  const conversationId =
    await getConversationId(orderId);

  /**
   * SYSTEM MESSAGE
   */

  await sendSystemMessage({
    conversationId,
    senderId: adminId,
    senderType: "admin",
    message:
      "❌ Admin rejected the cancellation request.",
  });

  /**
   * OPTIONAL ADMIN REASON
   */

  if (reason?.trim()) {
    await sendSystemMessage({
      conversationId,
      senderId: adminId,
      senderType: "admin",
      message: `Reason: ${reason.trim()}`,
    });
  }

  return {
    success: true,
  };
}