"use client";

import { useMemo } from "react";
import type { Order } from "@/types/order";

/**
 * =========================================================
 * ORDER PERMISSION ENGINE (FINAL CLEAN VERSION)
 * =========================================================
 *
 * FLOW:
 * requested
 * → accepted
 * → in_production (requires ANY payment)
 * → ready_for_pickup | ready_for_shipment
 * → shipped (delivery only)
 * → completed (requires FULL payment)
 * =========================================================
 */

export function useOrderPermissions(
  order: Order,
  totalPaid: number,
  finalTotal: number
) {
  return useMemo(() => {
    const {
      order_status,
      payment_status,
      cancel_status,
      delivery_method,
    } = order;

    const isCancelled = order_status === "cancelled";
    const isCompleted = order_status === "completed";
    const isLocked = isCancelled || isCompleted;

    const isRequested = order_status === "requested";
    const isAccepted = order_status === "accepted";
    const isInProduction = order_status === "in_production";

    const isReadyForPickup = order_status === "ready_for_pickup";
    const isReadyForShipment = order_status === "ready_for_shipment";

    const isShipped = order_status === "shipped";

    const hasAnyPayment = Number(totalPaid) > 0;
    const isFullyPaid = Number(totalPaid) >= Number(finalTotal);

    const isPickup = delivery_method === "pickup";
    const isDelivery = delivery_method === "delivery";

    /**
     * =========================================================
     * 1. ACCEPT ORDER
     * =========================================================
     */
    const canAccept = !isLocked && isRequested;

    /**
     * =========================================================
     * 2. FINALIZE CHARGES
     * (only before production)
     * =========================================================
     */
    const canFinalizeCharges =
      !isLocked &&
      isAccepted &&
      !isInProduction &&
      !isReadyForPickup &&
      !isReadyForShipment;

    /**
     * =========================================================
     * 3. START PRODUCTION
     * 🔥 FIXED RULE:
     * requires ANY payment (partial OR full)
     * =========================================================
     */
    const canStartProduction =
      !isLocked &&
      isAccepted &&
      hasAnyPayment &&
      !isInProduction &&
      !isReadyForPickup &&
      !isReadyForShipment;

    /**
     * =========================================================
     * 4. MARK READY
     * =========================================================
     */
    const canMarkReady =
      !isLocked &&
      isInProduction &&
      !isReadyForPickup &&
      !isReadyForShipment;

    /**
     * =========================================================
     * 5. DISPATCH (DELIVERY ONLY)
     * =========================================================
     */
    const canDispatch =
      !isLocked &&
      isDelivery &&
      isReadyForShipment &&
      !isShipped;

    /**
     * =========================================================
     * 6. COMPLETION LOGIC (STRICT PAYMENT RULE)
     * =========================================================
     */

    // PICKUP → completed directly
    const canCompletePickup =
      !isLocked &&
      isPickup &&
      isReadyForPickup &&
      isFullyPaid &&
      payment_status === "fully_paid";

    // DELIVERY → shipped → completed
    const canCompleteDelivery =
      !isLocked &&
      isDelivery &&
      isShipped &&
      isFullyPaid &&
      payment_status === "fully_paid";

    const canComplete = canCompletePickup || canCompleteDelivery;

    /**
     * =========================================================
     * CANCEL FLOW
     * =========================================================
     */
    const canReviewCancel =
      !isLocked && cancel_status === "requested";

    return {
      canAccept,
      canFinalizeCharges,
      canStartProduction,
      canMarkReady,
      canDispatch,
      canComplete,
      canReviewCancel,

      isFullyPaid,
      hasAnyPayment,
      isLocked,

      isPickup,
      isDelivery,
    };
  }, [order, totalPaid, finalTotal]);
}