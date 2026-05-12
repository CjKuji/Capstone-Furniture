"use client";

import { useMemo, useState } from "react";
import type { Order } from "@/types/order";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  order: Order;
  mode: "instant" | "request";
};

/**
 * =========================================================
 * INSTANT CANCEL RULES
 * =========================================================
 *
 * INSTANT:
 * - requested + unpaid
 * - accepted + unpaid
 *
 * REVIEW:
 * - partially_paid
 * - fully_paid
 * - in production+
 * =========================================================
 */
const isInstantCancel = (order: Order) => {
  return (
    ["requested", "accepted"].includes(order.order_status) &&
    order.payment_status === "unpaid"
  );
};

/**
 * =========================================================
 * MESSAGE LOGIC
 * =========================================================
 */
const getMessage = (order: Order) => {
  if (order.cancel_status === "requested") {
    return "⏳ Your cancellation request is already pending admin review.";
  }

  if (isInstantCancel(order)) {
    return "⚠️ Your order will be cancelled immediately after confirmation. This action cannot be undone.";
  }

  if (order.payment_status === "partially_paid") {
    return "⚠️ Partial payment already received. Admin will review your cancellation request and discuss possible refund processing.";
  }

  if (order.payment_status === "fully_paid") {
    return "⚠️ This order is already fully paid. Admin will review your cancellation request and discuss possible refund processing.";
  }

  return "⚠️ Your cancellation request requires admin review before approval.";
};

export default function CancelOrderModal({
  open,
  onClose,
  onConfirm,
  order,
}: Props) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * =========================================================
   * DERIVED MODE
   * =========================================================
   */
  const mode = useMemo<"instant" | "request">(() => {
    return isInstantCancel(order) ? "instant" : "request";
  }, [order]);

  const message = useMemo(() => getMessage(order), [order]);

  if (!open) return null;

  /**
   * =========================================================
   * SUBMIT
   * =========================================================
   */
  const handleSubmit = async () => {
    if (!reason.trim()) return;

    setLoading(true);

    try {
      await onConfirm(reason.trim());

      setReason("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  /**
   * =========================================================
   * RENDER
   * =========================================================
   */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[90%] max-w-md rounded-2xl bg-white p-5 space-y-4">

        {/* TITLE */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Cancel Order
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Order #{order.order_reference_code ?? "-"}
          </p>
        </div>

        {/* MODE */}
        <div
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            mode === "instant"
              ? "bg-red-100 text-red-600"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {mode === "instant"
            ? "Instant Cancellation"
            : "Admin Review Required"}
        </div>

        {/* MESSAGE */}
        <div
          className={`rounded-xl border px-3 py-3 text-xs leading-relaxed ${
            mode === "instant"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-yellow-200 bg-yellow-50 text-yellow-800"
          }`}
        >
          {message}
        </div>

        {/* REASON */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">
            Cancellation Reason
          </label>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please tell us why you want to cancel this order..."
            className="min-h-[110px] w-full rounded-xl border p-3 text-sm outline-none transition focus:border-gray-400"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 pt-2">

          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border px-4 py-2 text-sm"
          >
            Close
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : mode === "instant"
              ? "Cancel Order"
              : "Send Request"}
          </button>

        </div>
      </div>
    </div>
  );
}