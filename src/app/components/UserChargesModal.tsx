"use client";

import { useState } from "react";

import type { Order } from "@/types/order";

import { useChargeDecision } from "@/hooks/useChargeDecision";

type Props = {
  open: boolean;
  onClose: () => void;
  charges: any[];
  order: Order;
  userId: string;
};

export default function UserChargesModal({
  open,
  onClose,
  charges,
  order,
  userId,
}: Props) {
  const {
    acceptCharges,
    rejectCharges,
    isAccepting,
    isRejecting,
  } = useChargeDecision();

  const [error, setError] = useState<string | null>(null);

  const [confirmReject, setConfirmReject] =
    useState(false);

  if (!open) return null;

  /**
   * =========================================================
   * CALCULATIONS
   * =========================================================
   */

  const subtotal =
    order.order_items?.reduce(
      (sum, item) =>
        sum + Number(item.total_price ?? 0),
      0
    ) ?? 0;

  const chargesTotal = (charges ?? []).reduce(
    (sum, charge) => {
      const amount = Number(charge.amount ?? 0);

      return charge.is_additive
        ? sum + amount
        : sum - amount;
    },
    0
  );

  const previewTotal = subtotal + chargesTotal;

  /**
   * =========================================================
   * STATES
   * =========================================================
   */

  const hasCharges = charges.length > 0;

  const isAccepted =
    order.charge_status === "accepted";

  const isRejected =
    order.charge_status === "rejected";

  const isPending =
    order.charge_status === "pending";

  const showActions =
    hasCharges && isPending;

  /**
   * =========================================================
   * ACTIONS
   * =========================================================
   */

  const handleAccept = async () => {
    try {
      setError(null);

      await acceptCharges({
        orderId: order.id,
        userId,
      });

      onClose();
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to accept charges"
      );
    }
  };

  const handleReject = async () => {
    try {
      setError(null);

      // 🚀 fully system-driven rejection
      // no prompt
      // no textarea
      // no reason input

      await rejectCharges({
        orderId: order.id,
        userId,
      });

      setConfirmReject(false);

      onClose();
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to reject charges"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

        {/* =========================================================
            HEADER
        ========================================================= */}

        <div className="p-5 border-b">
          <div className="flex items-center justify-between">

            <h2 className="text-lg font-semibold">
              Additional Charges
            </h2>

            <button
              onClick={onClose}
              className="text-xl text-gray-500 hover:text-black"
            >
              ✕
            </button>
          </div>

          <p className="mt-1 text-xs text-gray-500">
            Order #
            {order.order_reference_code ||
              order.id}
          </p>
        </div>

        {/* =========================================================
            BODY
        ========================================================= */}

        <div className="p-5 space-y-4">

          {/* ERROR */}

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* SUBTOTAL */}

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Subtotal
            </span>

            <span className="font-medium">
              ₱{subtotal.toLocaleString()}
            </span>
          </div>

          {/* CHARGES */}

          <div className="space-y-2 max-h-56 overflow-y-auto">

            <p className="text-xs uppercase text-gray-400">
              Breakdown
            </p>

            {!hasCharges ? (
              <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-500">
                No additional charges were added
                to this order.
              </div>
            ) : (
              charges.map((charge) => (
                <div
                  key={charge.id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <span className="text-gray-700">
                    {charge.label ||
                      charge.type}
                  </span>

                  <span
                    className={
                      charge.is_additive
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {charge.is_additive
                      ? "+"
                      : "-"}{" "}
                    ₱
                    {Number(
                      charge.amount
                    ).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* TOTAL */}

          <div className="rounded-xl bg-gray-50 p-4">

            <div className="flex items-center justify-between">

              <span className="font-semibold">
                {isAccepted
                  ? "Final Total"
                  : "Estimated Total"}
              </span>

              <span className="text-lg font-bold">
                ₱{previewTotal.toLocaleString()}
              </span>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              {isAccepted
                ? "Charges confirmed and locked."
                : "Review charges before confirming."}
            </p>
          </div>

          {/* STATUS */}

          {isRejected && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              You rejected these charges.
              Admin will continue the discussion
              in chat.
            </div>
          )}

          {isAccepted && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              Charges confirmed and included in
              the final price.
            </div>
          )}

          {!hasCharges && (
            <div className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-500">
              No action required.
            </div>
          )}
        </div>

        {/* =========================================================
            FOOTER
        ========================================================= */}

        <div className="border-t p-4">

          {showActions ? (
            <div className="space-y-2">

              {/* ACCEPT */}

              <button
                onClick={handleAccept}
                disabled={
                  isAccepting ||
                  isRejecting
                }
                className="w-full rounded-xl bg-green-600 py-2 font-medium text-white disabled:opacity-50"
              >
                {isAccepting
                  ? "Accepting..."
                  : "Accept Charges"}
              </button>

              {/* REJECT */}

              <button
                onClick={() =>
                  setConfirmReject(true)
                }
                disabled={
                  isAccepting ||
                  isRejecting
                }
                className="w-full rounded-xl bg-red-600 py-2 font-medium text-white disabled:opacity-50"
              >
                Reject Charges
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-gray-900 py-2 font-medium text-white"
            >
              Close
            </button>
          )}
        </div>

        {/* =========================================================
            REJECT CONFIRMATION
        ========================================================= */}

        {confirmReject && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4">

            <div className="w-full max-w-sm rounded-xl bg-white p-5 space-y-4">

              <div className="space-y-2 text-center">

                <h3 className="font-semibold">
                  Reject these charges?
                </h3>

                <p className="text-sm text-gray-500">
                  This will notify the admin in
                  chat so they can revise the
                  pricing if needed.
                </p>
              </div>

              <div className="flex gap-2">

                <button
                  onClick={() =>
                    setConfirmReject(false)
                  }
                  className="flex-1 rounded-lg bg-gray-200 py-2"
                >
                  Cancel
                </button>

                <button
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="flex-1 rounded-lg bg-red-600 py-2 text-white disabled:opacity-50"
                >
                  {isRejecting
                    ? "Rejecting..."
                    : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}