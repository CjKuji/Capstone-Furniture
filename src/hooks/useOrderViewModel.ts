"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAdminOrder } from "@/hooks/useAdminOrders";
import { useOrderActions } from "@/hooks/useOrderActions";
import { paymentAggregateService } from "@/services/orders/paymentAggregateService";

/**
 * =========================================================
 * ORDER VIEW MODEL HOOK
 * =========================================================
 * PURPOSE:
 * - combines order + derived UI state + actions
 * - uses PAYMENT SERVICE as single source of truth
 * =========================================================
 */

export function useOrderViewModel(orderId?: string) {
  const { data: order, isLoading, error, refetch } =
    useAdminOrder(orderId);

  const actions = useOrderActions();

  /**
   * =========================================================
   * PAYMENT SOURCE OF TRUTH (CRITICAL FIX)
   * =========================================================
   */
  const { data: paymentSummary } = useQuery({
    queryKey: ["payment-summary", orderId],
    queryFn: () =>
      paymentAggregateService.getPaymentSummary(orderId!),
    enabled: !!orderId,
  });

  /**
   * =========================================================
   * DERIVED STATE
   * =========================================================
   */
  const derived = useMemo(() => {
    if (!order) return null;

    /**
     * IMPORTANT FIX:
     * payment comes from aggregate service, NOT DB column
     */
    const paymentStatus =
      paymentSummary?.status ?? "unpaid";

    const fulfillmentStatus = order.fulfillment_status;
    const orderStatus = order.status;

    // -------------------------
    // PAYMENT FLAGS (TRUTHFUL)
    // -------------------------
    const isUnpaid = paymentStatus === "unpaid";
    const isPartiallyPaid = paymentStatus === "partially_paid";
    const isFullyPaid = paymentStatus === "fully_paid";

    // -------------------------
    // PRODUCTION RULES
    // -------------------------
    const canStartProduction =
      isPartiallyPaid || isFullyPaid;

    const canMarkReady = isFullyPaid;

    const isInProduction =
      fulfillmentStatus === "in_production";

    const isReady =
      fulfillmentStatus === "ready_for_pickup";

    // -------------------------
    // ORDER STATUS FLAGS
    // -------------------------
    const isPendingReview =
      orderStatus === "pending_review";

    const isInReview =
      orderStatus === "in_review";

    const isQuoted =
      orderStatus === "quoted";

    const isAccepted =
      orderStatus === "accepted";

    const isCompleted =
      orderStatus === "completed";

    const isCancelled =
      orderStatus === "cancelled";

    // -------------------------
    // UI LABELS
    // -------------------------
    const paymentBadge =
      paymentStatus === "unpaid"
        ? "Unpaid"
        : paymentStatus === "partially_paid"
        ? "Partially Paid"
        : paymentStatus === "fully_paid"
        ? "Fully Paid"
        : "Loading...";

    const fulfillmentBadge =
      isInProduction
        ? "In Production"
        : isReady
        ? "Ready"
        : fulfillmentStatus ?? "Not Started";

    return {
      order,

      paymentStatus,
      fulfillmentStatus,
      orderStatus,

      // payment
      isUnpaid,
      isPartiallyPaid,
      isFullyPaid,

      // fulfillment
      isInProduction,
      isReady,

      // order states
      isPendingReview,
      isInReview,
      isQuoted,
      isAccepted,
      isCompleted,
      isCancelled,

      // permissions
      canStartProduction,
      canMarkReady,

      // UI helpers
      paymentBadge,
      fulfillmentBadge,
    };
  }, [order, paymentSummary]);

  /**
   * =========================================================
   * ACTIONS (SAFE)
   * =========================================================
   */
  const enhancedActions = useMemo(() => {
    if (!orderId) return actions;

    return {
      ...actions,

      startProduction: (adminId: string) =>
        actions.startProduction(orderId, adminId),

      markReady: (adminId: string) =>
        actions.markReady(orderId, adminId),

      markShipped: (adminId: string) =>
        actions.markShipped(orderId, adminId),

      markPickedUp: (adminId: string) =>
        actions.markPickedUp(orderId, adminId),

      markDelivered: (adminId: string) =>
        actions.markDelivered(orderId, adminId),
    };
  }, [actions, orderId]);

  return {
    order,
    isLoading,
    error,
    refetch,

    derived,
    actions: enhancedActions,
  };
}