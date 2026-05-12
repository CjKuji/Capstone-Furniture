"use client";

import { useEffect, useMemo, useState } from "react";

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

  const [error, setError] =
    useState<string | null>(null);

  const [confirmReject, setConfirmReject] =
    useState(false);

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
        if (confirmReject) {
          setConfirmReject(false);
          return;
        }

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
  }, [open, onClose, confirmReject]);

  /**
   * =========================================================
   * SCROLL LOCK
   * =========================================================
   */
  useEffect(() => {
    if (!open) return;

    const prevOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        prevOverflow;
    };
  }, [open]);

  /**
   * =========================================================
   * CALCULATIONS
   * =========================================================
   */
  const subtotal = useMemo(() => {
    return (
      order.order_items?.reduce(
        (sum, item) =>
          sum +
          Number(item.total_price ?? 0),
        0
      ) ?? 0
    );
  }, [order.order_items]);

  const chargesTotal = useMemo(() => {
    return (charges ?? []).reduce(
      (sum, charge) => {
        const amount = Number(
          charge.amount ?? 0
        );

        return charge.is_additive
          ? sum + amount
          : sum - amount;
      },
      0
    );
  }, [charges]);

  const previewTotal =
    subtotal + chargesTotal;

  /**
   * =========================================================
   * STATES
   * =========================================================
   */
  const hasCharges =
    charges.length > 0;

  const isAccepted =
    order.charge_status ===
    "accepted";

  const isRejected =
    order.charge_status ===
    "rejected";

  const isPending =
    order.charge_status ===
    "pending";

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

  /**
   * =========================================================
   * CLOSE
   * =========================================================
   */
  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-[99999]
        flex items-center justify-center
        bg-black/60 backdrop-blur-sm
        p-4
      "
      onClick={onClose}
    >
      {/* =====================================================
          MODAL
      ===================================================== */}
      <div
        onClick={(e) =>
          e.stopPropagation()
        }
        className="
          relative
          w-full max-w-2xl
          overflow-hidden
          rounded-[30px]
          border border-[#E8D9CC]
          bg-[#FAF6F1]
          shadow-[0_25px_80px_rgba(0,0,0,0.18)]
        "
      >
        {/* =================================================
            HEADER
        ================================================= */}
        <div
          className="
            border-b border-[#E8D9CC]
            bg-white
            px-6 py-5
          "
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="
                  text-[11px]
                  uppercase tracking-[0.18em]
                  text-[#8C593F]
                "
              >
                Additional Pricing
              </p>

              <h2
                className="
                  mt-1
                  text-2xl font-semibold
                  text-[#2B1D16]
                "
              >
                Review Additional Charges
              </h2>

              <p
                className="
                  mt-2
                  text-sm text-[#7B6A5F]
                "
              >
                Order #
                {order.order_reference_code ||
                  order.id}
              </p>
            </div>

            <button
              onClick={onClose}
              className="
                flex h-10 w-10
                items-center justify-center
                rounded-full
                border border-[#E8D9CC]
                bg-[#FAF6F1]
                text-[#6B584B]
                transition
                hover:bg-[#F3E7DD]
              "
            >
              ✕
            </button>
          </div>
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}
        <div
          className="
            max-h-[72vh]
            overflow-y-auto
            p-6
            space-y-6
          "
        >
          {/* ERROR */}
          {error && (
            <div
              className="
                rounded-2xl
                border border-red-200
                bg-red-50
                px-4 py-3
                text-sm text-red-600
              "
            >
              {error}
            </div>
          )}

          {/* =============================================
              SUMMARY
          ============================================= */}
          <div
            className="
              rounded-3xl
              border border-[#E8D9CC]
              bg-white
              p-5
            "
          >
            <div className="mb-5">
              <h3
                className="
                  text-sm font-semibold
                  text-[#2B1D16]
                "
              >
                Price Summary
              </h3>

              <p
                className="
                  mt-1
                  text-xs text-[#8C593F]
                "
              >
                Review the updated pricing
                before continuing
              </p>
            </div>

            <div className="space-y-4">
              <SummaryRow
                label="Current Subtotal"
                value={`₱${subtotal.toLocaleString()}`}
              />

              <SummaryRow
                label="Additional Charges"
                value={`₱${Math.abs(
                  chargesTotal
                ).toLocaleString()}`}
                positive={chargesTotal >= 0}
              />

              <div
                className="
                  border-t border-dashed
                  border-[#E8D9CC]
                  pt-4
                "
              >
                <SummaryRow
                  label={
                    isAccepted
                      ? "Final Total"
                      : "Estimated Total"
                  }
                  value={`₱${previewTotal.toLocaleString()}`}
                  large
                />
              </div>
            </div>
          </div>

          {/* =============================================
              CHARGES LIST
          ============================================= */}
          <div
            className="
              rounded-3xl
              border border-[#E8D9CC]
              bg-white
              overflow-hidden
            "
          >
            <div
              className="
                border-b border-[#F0E4D8]
                px-5 py-4
              "
            >
              <h3
                className="
                  text-sm font-semibold
                  text-[#2B1D16]
                "
              >
                Charges Breakdown
              </h3>

              <p
                className="
                  mt-1
                  text-xs text-[#8C593F]
                "
              >
                Detailed adjustments added
                to your order
              </p>
            </div>

            {!hasCharges ? (
              <div className="p-5">
                <div
                  className="
                    rounded-2xl
                    border border-dashed
                    border-[#E8D9CC]
                    bg-[#FAF6F1]
                    p-6
                    text-center
                  "
                >
                  <p
                    className="
                      text-sm font-medium
                      text-[#2B1D16]
                    "
                  >
                    No Additional Charges
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs text-[#7B6A5F]
                    "
                  >
                    Your order currently has
                    no extra pricing changes.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#F4E8DC]">
                {charges.map((charge) => {
                  const amount = Number(
                    charge.amount ?? 0
                  );

                  const isAdditive =
                    charge.is_additive;

                  return (
                    <div
                      key={charge.id}
                      className="
                        flex items-start justify-between
                        gap-4
                        px-5 py-4
                      "
                    >
                      <div className="flex-1">
                        <div
                          className="
                            text-sm font-medium
                            text-[#2B1D16]
                          "
                        >
                          {charge.label ||
                            charge.type}
                        </div>

                        {charge.description && (
                          <p
                            className="
                              mt-1
                              text-xs text-[#7B6A5F]
                            "
                          >
                            {
                              charge.description
                            }
                          </p>
                        )}
                      </div>

                      <div
                        className={`
                          rounded-xl px-3 py-2
                          text-sm font-semibold

                          ${
                            isAdditive
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-600"
                          }
                        `}
                      >
                        {isAdditive
                          ? "+"
                          : "-"}
                        ₱
                        {amount.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* =============================================
              STATUS
          ============================================= */}
          {isAccepted && (
            <div
              className="
                rounded-2xl
                border border-green-200
                bg-green-50
                px-5 py-4
              "
            >
              <p
                className="
                  text-sm font-semibold
                  text-green-700
                "
              >
                Charges Confirmed
              </p>

              <p
                className="
                  mt-1
                  text-xs text-green-600
                "
              >
                These additional charges
                were accepted and are now
                included in the final order
                price.
              </p>
            </div>
          )}

          {isRejected && (
            <div
              className="
                rounded-2xl
                border border-red-200
                bg-red-50
                px-5 py-4
              "
            >
              <p
                className="
                  text-sm font-semibold
                  text-red-700
                "
              >
                Charges Rejected
              </p>

              <p
                className="
                  mt-1
                  text-xs text-red-600
                "
              >
                The admin has been notified.
                Continue the discussion in
                chat if revisions are needed.
              </p>
            </div>
          )}

          {!hasCharges && (
            <div
              className="
                rounded-2xl
                border border-[#E8D9CC]
                bg-white
                px-5 py-4
              "
            >
              <p
                className="
                  text-sm text-[#6B584B]
                "
              >
                No customer action is needed
                at this time.
              </p>
            </div>
          )}
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}
        <div
          className="
            border-t border-[#E8D9CC]
            bg-white
            p-5
          "
        >
          {showActions ? (
            <div className="flex gap-3">
              {/* REJECT */}
              <button
                onClick={() =>
                  setConfirmReject(true)
                }
                disabled={
                  isAccepting ||
                  isRejecting
                }
                className="
                  flex-1 rounded-2xl
                  border border-red-200
                  bg-red-50
                  py-3
                  text-sm font-semibold
                  text-red-600
                  transition
                  hover:bg-red-100
                  disabled:opacity-50
                "
              >
                Reject Charges
              </button>

              {/* ACCEPT */}
              <button
                onClick={handleAccept}
                disabled={
                  isAccepting ||
                  isRejecting
                }
                className="
                  flex-1 rounded-2xl
                  bg-[#8C593F]
                  py-3
                  text-sm font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-[#73452C]
                  disabled:opacity-50
                "
              >
                {isAccepting
                  ? "Accepting..."
                  : "Accept Charges"}
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="
                w-full rounded-2xl
                bg-[#2B1D16]
                py-3
                text-sm font-semibold
                text-white
                transition
                hover:opacity-95
              "
            >
              Close
            </button>
          )}
        </div>

        {/* =================================================
            REJECT CONFIRM
        ================================================= */}
        {confirmReject && (
          <div
            className="
              absolute inset-0 z-50
              flex items-center justify-center
              bg-black/50
              p-4
            "
          >
            <div
              className="
                w-full max-w-md
                rounded-[28px]
                border border-[#E8D9CC]
                bg-white
                p-6
                shadow-2xl
              "
            >
              <div className="text-center">
                <div
                  className="
                    mx-auto
                    flex h-14 w-14
                    items-center justify-center
                    rounded-full
                    bg-red-50
                    text-2xl
                  "
                >
                  !
                </div>

                <h3
                  className="
                    mt-4
                    text-xl font-semibold
                    text-[#2B1D16]
                  "
                >
                  Reject Additional Charges?
                </h3>

                <p
                  className="
                    mt-2
                    text-sm text-[#7B6A5F]
                  "
                >
                  The admin will be notified
                  and can revise the pricing
                  through the order chat.
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() =>
                    setConfirmReject(false)
                  }
                  className="
                    flex-1 rounded-2xl
                    border border-[#E8D9CC]
                    py-3
                    text-sm font-medium
                    text-[#4B3A30]
                    transition
                    hover:bg-[#FAF6F1]
                  "
                >
                  Cancel
                </button>

                <button
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="
                    flex-1 rounded-2xl
                    bg-red-600
                    py-3
                    text-sm font-semibold
                    text-white
                    transition
                    hover:bg-red-700
                    disabled:opacity-50
                  "
                >
                  {isRejecting
                    ? "Rejecting..."
                    : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY ROW
========================================================= */

type SummaryRowProps = {
  label: string;
  value: string;
  positive?: boolean;
  large?: boolean;
};

function SummaryRow({
  label,
  value,
  positive,
  large,
}: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className="
          text-sm text-[#6B5B52]
        "
      >
        {label}
      </span>

      <span
        className={`
          ${
            large
              ? "text-2xl font-bold"
              : "text-sm font-semibold"
          }

          ${
            positive === undefined
              ? "text-[#2B1D16]"
              : positive
                ? "text-green-700"
                : "text-red-600"
          }
        `}
      >
        {value}
      </span>
    </div>
  );
}