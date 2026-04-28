import { supabase } from "@/lib/supabase";
import type { OrderStatus, PaymentStatus } from "@/types/enums";

import { paymentAggregateService } from "./paymentAggregateService";
import { paymentService } from "./paymentService";
import { fulfillmentService } from "./fulfillmentService";
import { timelineService } from "./timelineService";

/**
 * =========================================================
 * ORDER FLOW SERVICE (ORCHESTRATOR)
 * =========================================================
 * ONLY responsible for:
 * - state transitions
 * - coordinating services
 * =========================================================
 */

/* =========================================================
   1. ACCEPT ORDER
   pending_review → in_review
========================================================= */
export async function acceptOrder(orderId: string, adminId: string) {
  const { error } = await supabase
    .from("orders")
    .update({
      status: "in_review" as OrderStatus,
    })
    .eq("id", orderId);

  if (error) throw error;

  await timelineService.log({
    orderId,
    actorId: adminId,
    title: "Order Accepted",
    description: "Admin started reviewing order",
    event: "order_review_started",
  });
}

/* =========================================================
   2. CREATE / SEND QUOTE
   in_review → quoted
========================================================= */
export async function createQuote(
  orderId: string,
  adminId: string,
  items: { name: string; amount: number; type?: string }[]
) {
  const total = items.reduce((s, i) => s + Number(i.amount), 0);

  const { error } = await supabase.from("order_quote_items").insert(
    items.map((i) => ({
      order_id: orderId,
      name: i.name,
      amount: i.amount,
      type: i.type ?? "fee",
      created_by: adminId,
    }))
  );

  if (error) throw error;

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "quoted" as OrderStatus,
      quote_total_price: total,
    })
    .eq("id", orderId);

  if (updateError) throw updateError;

  await timelineService.log({
    orderId,
    actorId: adminId,
    title: "Quote Sent",
    description: `Total: ₱${total}`,
    event: "quote_sent",
  });
}

/* =========================================================
   3. USER ACCEPTS QUOTE
   quoted → accepted
========================================================= */
export async function acceptQuote(orderId: string, userId: string) {
  const { error } = await supabase
    .from("orders")
    .update({
      status: "accepted" as OrderStatus,
      payment_status: "unpaid" as PaymentStatus,
    })
    .eq("id", orderId)
    .eq("user_id", userId);

  if (error) throw error;

  await timelineService.log({
    orderId,
    actorId: userId,
    title: "Quote Accepted",
    description: "Customer accepted quote",
    event: "quote_sent",
  });
}

/* =========================================================
   4. USER SUBMITS PAYMENT
   accepted → processing
========================================================= */
export async function submitPayment({
  orderId,
  userId,
  amount,
  referenceNumber,
  proofImageUrl,
}: {
  orderId: string;
  userId: string;
  amount: number;
  referenceNumber?: string | null;
  proofImageUrl: string;
}) {
  // 1. create payment
  await paymentService.createPayment({
    orderId,
    userId,
    amount,
    referenceNumber,
    proofImageUrl,
  });

  // 2. compute payment status
  const paymentStatus =
    await paymentAggregateService.calculatePaymentStatus(orderId);

  // 3. update order
  await supabase
    .from("orders")
    .update({
      status: "processing" as OrderStatus,
      payment_status: paymentStatus,
    })
    .eq("id", orderId);

  await timelineService.log({
    orderId,
    actorId: userId,
    title: "Payment Submitted",
    description: `Status: ${paymentStatus}`,
    event: "payment_submitted",
  });
}

/* =========================================================
   5. ADMIN VERIFIES PAYMENT
========================================================= */
export async function verifyPayment(orderId: string, adminId: string) {
  const paymentStatus =
    await paymentAggregateService.calculatePaymentStatus(orderId);

  await supabase
    .from("orders")
    .update({
      payment_status: paymentStatus,
    })
    .eq("id", orderId);

  await timelineService.log({
    orderId,
    actorId: adminId,
    title: "Payment Verified",
    description: `Updated to ${paymentStatus}`,
    event: "payment_verified",
  });
}

/* =========================================================
   6. START PRODUCTION
========================================================= */
export async function startProduction(orderId: string, adminId: string) {
  const paymentStatus =
    await paymentAggregateService.calculatePaymentStatus(orderId);

  if (paymentStatus === "unpaid") {
    throw new Error("Cannot start production: no payment");
  }

  const { error } = await supabase
    .from("orders")
    .update({
      fulfillment_status: "in_production",
    })
    .eq("id", orderId);

  if (error) throw error;

  await timelineService.log({
    orderId,
    actorId: adminId,
    title: "Production Started",
    description: "Work has begun",
    event: "production_started",
  });
}

/* =========================================================
   7. MARK READY (ONLY FULLY PAID)
========================================================= */
export async function markReady(orderId: string, adminId: string) {
  const paymentStatus =
    await paymentAggregateService.calculatePaymentStatus(orderId);

  if (paymentStatus !== "fully_paid") {
    throw new Error("Order must be fully paid before marking ready");
  }

  await supabase
    .from("orders")
    .update({
      fulfillment_status: "ready_for_pickup",
    })
    .eq("id", orderId);

  await timelineService.log({
    orderId,
    actorId: adminId,
    title: "Order Ready",
    description: "Fully paid and ready for release",
    event: "order_ready",
  });
}

/* =========================================================
   8. SHIP / PICKUP FLOW
========================================================= */
export async function markShipped(orderId: string, adminId: string) {
  await fulfillmentService.markShipped(orderId);

  await timelineService.log({
    orderId,
    actorId: adminId,
    title: "Order Shipped",
    description: "On the way",
    event: "order_shipped",
  });
}

export async function markPickedUp(orderId: string, adminId: string) {
  await fulfillmentService.markPickedUp(orderId);

  await timelineService.log({
    orderId,
    actorId: adminId,
    title: "Order Picked Up",
    description: "Customer collected item",
    event: "order_completed",
  });
}

/* =========================================================
   9. DELIVERED
========================================================= */
export async function markDelivered(orderId: string, adminId: string) {
  await fulfillmentService.markDelivered(orderId);

  await supabase
    .from("orders")
    .update({
      status: "completed" as OrderStatus,
    })
    .eq("id", orderId);

  await timelineService.log({
    orderId,
    actorId: adminId,
    title: "Order Delivered",
    description: "Completed successfully",
    event: "order_delivered",
  });
}