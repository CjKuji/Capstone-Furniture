"use client";

import { useMemo, useState, useEffect } from "react";

import type { Order } from "@/types/order";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  order: Order;
  mode: "instant" | "request";
};

/* =========================================================
   INSTANT CANCEL RULES
========================================================= */
const isInstantCancel = (order: Order) => {
  return (
    ["requested", "accepted"].includes(order.order_status) &&
    order.payment_status === "unpaid"
  );
};

/* =========================================================
   MESSAGE
========================================================= */
const getMessage = (order: Order) => {
  if (order.cancel_status === "requested") {
    return "Your cancellation request is already pending admin review.";
  }

  if (isInstantCancel(order)) {
    return "Your order will be cancelled immediately after confirmation. This action cannot be undone.";
  }

  if (order.payment_status === "partially_paid") {
    return "Partial payment has already been received. Admin review is required before cancellation approval and refund discussion.";
  }

  if (order.payment_status === "fully_paid") {
    return "This order is already fully paid. Admin review is required before cancellation approval and refund discussion.";
  }

  return "This cancellation request requires admin review before approval.";
};

export default function CancelOrderModal({
  open,
  onClose,
  onConfirm,
  order,
}: Props) {
  const [reason, setReason] = useState("");

  const [loading, setLoading] =
    useState(false);

  /**
   * =========================================================
   * DERIVED MODE
   * =========================================================
   */
  const mode = useMemo<
    "instant" | "request"
  >(() => {
    return isInstantCancel(order)
      ? "instant"
      : "request";
  }, [order]);

  const message = useMemo(
    () => getMessage(order),
    [order]
  );

  /**
   * =========================================================
   * RESET
   * =========================================================
   */
  useEffect(() => {
    if (!open) {
      setReason("");
      setLoading(false);
    }
  }, [open]);

  /**
   * =========================================================
   * ESC CLOSE
   * =========================================================
   */
  useEffect(() => {
    if (!open) return;

    const handleKey = (
      e: KeyboardEvent
    ) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKey
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKey
      );
    };
  }, [open, onClose]);

  /**
   * =========================================================
   * BODY LOCK
   * =========================================================
   */
  useEffect(() => {
    if (!open) return;

    const prev =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        prev;
    };
  }, [open]);

  /**
   * =========================================================
   * SUBMIT
   * =========================================================
   */
  const handleSubmit = async () => {
    if (!reason.trim()) return;

    try {
      setLoading(true);

      await onConfirm(reason.trim());

      setReason("");

      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const isPending =
    order.cancel_status === "requested";

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) =>
          e.stopPropagation()
        }
        className="
          w-full
          max-w-lg
          overflow-hidden
          rounded-[30px]
          border
          border-[#E8D9CC]
          bg-[#FAF7F2]
          shadow-[0_20px_60px_rgba(0,0,0,0.18)]
        "
      >
        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="border-b border-[#E8D9CC] bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-[20px] font-semibold text-[#2B1D16]">
                Cancel Order
              </h2>

              <p className="mt-1 text-sm text-[#8C593F]">
                Order #
                {order.order_reference_code ??
                  order.id}
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={loading}
              className="
                flex h-10 w-10 items-center justify-center
                rounded-full
                border border-[#E8D9CC]
                bg-[#FAF7F2]
                text-[#6B584B]
                transition
                hover:bg-[#F3E7DD]
              "
            >
              ✕
            </button>
          </div>
        </div>

        {/* =====================================================
            CONTENT
        ===================================================== */}
        <div className="space-y-5 px-6 py-6">
          {/* STATUS BADGE */}
          <div
            className={`
              inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold

              ${
                mode === "instant"
                  ? `
                    border border-red-200
                    bg-red-50
                    text-red-700
                  `
                  : `
                    border border-amber-200
                    bg-amber-50
                    text-amber-700
                  `
              }
            `}
          >
            {mode === "instant"
              ? "Instant Cancellation"
              : "Admin Review Required"}
          </div>

          {/* INFO CARD */}
          <div
            className={`
              rounded-2xl border p-4

              ${
                mode === "instant"
                  ? `
                    border-red-200
                    bg-red-50
                  `
                  : `
                    border-amber-200
                    bg-amber-50
                  `
              }
            `}
          >
            <div className="flex gap-3">
              <div className="mt-[2px] text-lg">
                {mode === "instant"
                  ? "⚠️"
                  : "📝"}
              </div>

              <div>
                <p
                  className={`
                    text-sm leading-relaxed

                    ${
                      mode === "instant"
                        ? "text-red-700"
                        : "text-amber-800"
                    }
                  `}
                >
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* ORDER SUMMARY */}
          <div className="rounded-2xl border border-[#E8D9CC] bg-white p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6B5B52]">
                Order Status
              </span>

              <span className="font-medium capitalize text-[#2B1D16]">
                {order.order_status?.replace(
                  /_/g,
                  " "
                )}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-[#6B5B52]">
                Payment Status
              </span>

              <span className="font-medium capitalize text-[#2B1D16]">
                {order.payment_status?.replace(
                  /_/g,
                  " "
                )}
              </span>
            </div>

            {isPending && (
              <div className="mt-4 rounded-xl border border-[#E8D9CC] bg-[#FAF7F2] px-4 py-3">
                <p className="text-xs leading-relaxed text-[#8C593F]">
                  A cancellation request has
                  already been submitted and is
                  waiting for admin review.
                </p>
              </div>
            )}
          </div>

          {/* REASON */}
          {!isPending && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#2B1D16]">
                Cancellation Reason
              </label>

              <textarea
                value={reason}
                onChange={(e) =>
                  setReason(e.target.value)
                }
                placeholder="Tell us why you want to cancel this order..."
                className="
                  min-h-[140px]
                  w-full
                  resize-none
                  rounded-2xl
                  border
                  border-[#E8D9CC]
                  bg-white
                  px-4
                  py-4
                  text-sm
                  text-[#2B1D16]
                  outline-none
                  transition

                  placeholder:text-[#B89B87]

                  focus:border-[#C6A892]
                  focus:ring-4
                  focus:ring-[#E8D9CC]/50
                "
              />

              <div className="flex justify-between text-xs text-[#8C593F]/70">
                <span>
                  This message will be visible
                  to the admin.
                </span>

                <span>
                  {reason.length}/500
                </span>
              </div>
            </div>
          )}
        </div>

        {/* =====================================================
            FOOTER
        ===================================================== */}
        <div className="border-t border-[#E8D9CC] bg-white px-6 py-5">
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              onClick={onClose}
              disabled={loading}
              className="
                flex-1
                rounded-2xl
                border
                border-[#E8D9CC]
                bg-white
                py-3.5
                text-sm
                font-medium
                text-[#2B1D16]
                transition

                hover:bg-[#FAF7F2]
                disabled:opacity-50
              "
            >
              Close
            </button>

            {!isPending && (
              <button
                onClick={handleSubmit}
                disabled={
                  loading ||
                  !reason.trim()
                }
                className={`
                  flex-1
                  rounded-2xl
                  py-3.5
                  text-sm
                  font-semibold
                  text-white
                  transition

                  disabled:cursor-not-allowed
                  disabled:opacity-50

                  ${
                    mode === "instant"
                      ? `
                        bg-red-600
                        hover:bg-red-700
                      `
                      : `
                        bg-[#8C593F]
                        hover:bg-[#6F4732]
                      `
                  }
                `}
              >
                {loading
                  ? "Processing..."
                  : mode === "instant"
                  ? "Cancel Order"
                  : "Send Cancellation Request"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}