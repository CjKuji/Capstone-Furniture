"use client";

import { useEffect, useMemo, useState } from "react";

import type { Order } from "@/types/order";

import {
  PaymentType,
  usePayment,
} from "@/hooks/usePayment";

import { usePaymentsQuery } from "@/hooks/useFetchPayments";

import { calculatePaymentBreakdown } from "@/utils/paymentCalculator";

type Props = {
  open: boolean;
  onClose: () => void;
  order: Order;
  totalAmount: number;
};

export default function PayModal({
  open,
  onClose,
  order,
  totalAmount,
}: Props) {
  const {
    pay,
    loading,
    error,
    resetError,
  } = usePayment();

  /**
   * =========================================================
   * PAYMENTS QUERY
   * =========================================================
   */
  const { data: paymentsData } =
    usePaymentsQuery(order.id);

  const totalPaid =
    paymentsData?.totalPaid ?? 0;

  const hasPaidAnything =
    totalPaid > 0;

  /**
   * =========================================================
   * SAFE TOTAL
   * =========================================================
   */
  const safeTotalAmount = useMemo(() => {
    const parsed = Number(totalAmount);

    if (
      !parsed ||
      parsed <= 0 ||
      isNaN(parsed)
    ) {
      return 0;
    }

    return parsed;
  }, [totalAmount]);

  /**
   * =========================================================
   * PAYMENT TYPE
   * =========================================================
   */
  const [paymentType, setPaymentType] =
    useState<PaymentType>("partial");

  /**
   * =========================================================
   * BREAKDOWN
   * =========================================================
   */
  const breakdown = useMemo(() => {
    return calculatePaymentBreakdown(
      safeTotalAmount,
      totalPaid,
      paymentType
    );
  }, [
    safeTotalAmount,
    totalPaid,
    paymentType,
  ]);

  const payNowAmount =
    breakdown.payNow ?? 0;

  const remainingBalance = Math.max(
    safeTotalAmount - totalPaid,
    0
  );

  /**
   * =========================================================
   * SHOW OPTIONS
   * Only on first payment
   * =========================================================
   */
  const showPaymentOptions =
    totalPaid === 0;

  /**
   * =========================================================
   * LABELS
   * =========================================================
   */
  const payButtonLabel = hasPaidAnything
    ? "Pay Remaining"
    : paymentType === "full"
      ? "Pay Full"
      : "Pay Partial";

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
   * PAY
   * =========================================================
   */
  const handlePay = async () => {
    try {
      resetError();

      await pay({
        orderId: order.id,
        userId: order.user_id,

        type: hasPaidAnything
          ? "partial"
          : paymentType,
      });
    } catch (err) {
      console.error(err);
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
          w-full max-w-xl
          overflow-hidden
          rounded-[28px]
          border border-[#E8D9CC]
          bg-[#FAF6F1]
          shadow-[0_20px_60px_rgba(0,0,0,0.18)]
        "
      >
        {/* =================================================
            HEADER
        ================================================= */}
        <div
          className="
            flex items-start justify-between
            border-b border-[#E8D9CC]
            bg-white
            px-6 py-5
          "
        >
          <div>
            <p
              className="
                text-[11px]
                uppercase tracking-[0.18em]
                text-[#8C593F]
              "
            >
              Payment
            </p>

            <h2
              className="
                mt-1
                text-xl font-semibold
                text-[#2B1D16]
              "
            >
              Complete Your Payment
            </h2>

            <p
              className="
                mt-1
                text-sm text-[#7B6A5F]
              "
            >
              Order #
              {order.order_reference_code}
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

        {/* =================================================
            CONTENT
        ================================================= */}
        <div
          className="
            max-h-[70vh]
            overflow-y-auto
            space-y-5
            p-6
          "
        >
          {/* =============================================
              ORDER SUMMARY
          ============================================= */}
          <div
            className="
              rounded-3xl
              border border-[#E8D9CC]
              bg-white
              p-5
            "
          >
            <div className="mb-4">
              <h3
                className="
                  text-sm font-semibold
                  text-[#2B1D16]
                "
              >
                Order Summary
              </h3>

              <p
                className="
                  mt-1
                  text-xs text-[#8C593F]
                "
              >
                Review your payment details
              </p>
            </div>

            <div className="space-y-4">
              <SummaryRow
                label="Customer"
                value={
                  order.customer_name ??
                  "Unknown"
                }
              />

              <SummaryRow
                label="Delivery Method"
                value={
                  order.delivery_method
                }
                capitalize
              />

              <SummaryRow
                label="Order Total"
                value={`₱${safeTotalAmount.toLocaleString()}`}
                strong
              />

              <SummaryRow
                label="Already Paid"
                value={`₱${totalPaid.toLocaleString()}`}
              />

              <div
                className="
                  border-t border-dashed
                  border-[#E8D9CC]
                  pt-4
                "
              >
                <SummaryRow
                  label="Remaining Balance"
                  value={`₱${remainingBalance.toLocaleString()}`}
                  strong
                />
              </div>
            </div>
          </div>

          {/* =============================================
              PAYMENT OPTION
          ============================================= */}
          {showPaymentOptions && (
            <div
              className="
                rounded-3xl
                border border-[#E8D9CC]
                bg-white
                p-5
              "
            >
              <div className="mb-4">
                <h3
                  className="
                    text-sm font-semibold
                    text-[#2B1D16]
                  "
                >
                  Choose Payment Option
                </h3>

                <p
                  className="
                    mt-1
                    text-xs text-[#8C593F]
                  "
                >
                  Select how you want to
                  start your order payment
                </p>
              </div>

              <div className="space-y-3">
                {/* PARTIAL */}
                <button
                  onClick={() =>
                    setPaymentType(
                      "partial"
                    )
                  }
                  className={`
                    w-full rounded-2xl border p-4 text-left transition

                    ${
                      paymentType ===
                      "partial"
                        ? "border-[#8C593F] bg-[#F6EFE8]"
                        : "border-[#E8D9CC] bg-white hover:bg-[#FAF6F1]"
                    }
                  `}
                >
                  <div
                    className="
                      flex items-start justify-between
                    "
                  >
                    <div>
                      <div
                        className="
                          text-sm font-semibold
                          text-[#2B1D16]
                        "
                      >
                        Partial Payment
                      </div>

                      <div
                        className="
                          mt-1
                          text-xs text-[#7B6A5F]
                        "
                      >
                        Pay 50% now and the
                        remaining later
                      </div>
                    </div>

                    <div
                      className="
                        text-right
                      "
                    >
                      <div
                        className="
                          text-lg font-bold
                          text-[#2B1D16]
                        "
                      >
                        ₱
                        {Math.round(
                          safeTotalAmount *
                            0.5
                        ).toLocaleString()}
                      </div>

                      <div
                        className="
                          text-[11px]
                          text-[#8C593F]
                        "
                      >
                        Due now
                      </div>
                    </div>
                  </div>
                </button>

                {/* FULL */}
                <button
                  onClick={() =>
                    setPaymentType("full")
                  }
                  className={`
                    w-full rounded-2xl border p-4 text-left transition

                    ${
                      paymentType ===
                      "full"
                        ? "border-[#8C593F] bg-[#F6EFE8]"
                        : "border-[#E8D9CC] bg-white hover:bg-[#FAF6F1]"
                    }
                  `}
                >
                  <div
                    className="
                      flex items-start justify-between
                    "
                  >
                    <div>
                      <div
                        className="
                          text-sm font-semibold
                          text-[#2B1D16]
                        "
                      >
                        Full Payment
                      </div>

                      <div
                        className="
                          mt-1
                          text-xs text-[#7B6A5F]
                        "
                      >
                        Complete the full
                        payment immediately
                      </div>
                    </div>

                    <div
                      className="
                        text-right
                      "
                    >
                      <div
                        className="
                          text-lg font-bold
                          text-[#2B1D16]
                        "
                      >
                        ₱
                        {safeTotalAmount.toLocaleString()}
                      </div>

                      <div
                        className="
                          text-[11px]
                          text-[#8C593F]
                        "
                      >
                        Due now
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* =============================================
              PAYMENT TOTAL CARD
          ============================================= */}
          <div
            className="
              rounded-3xl
              border border-[#D9C1AF]
              bg-[#F3E7DD]
              p-5
            "
          >
            <div
              className="
                flex items-center justify-between
              "
            >
              <div>
                <p
                  className="
                    text-xs uppercase tracking-wide
                    text-[#8C593F]
                  "
                >
                  {hasPaidAnything
                    ? "Remaining Payment"
                    : "Amount Due"}
                </p>

                <h3
                  className="
                    mt-2
                    text-3xl font-bold
                    text-[#2B1D16]
                  "
                >
                  ₱
                  {payNowAmount.toLocaleString()}
                </h3>
              </div>

              <div
                className="
                  rounded-2xl
                  border border-[#D9C1AF]
                  bg-white/70
                  px-4 py-3
                  text-right
                "
              >
                <div
                  className="
                    text-[11px]
                    text-[#8C593F]
                  "
                >
                  Status
                </div>

                <div
                  className="
                    mt-1
                    text-sm font-semibold
                    text-[#2B1D16]
                  "
                >
                  {hasPaidAnything
                    ? "Remaining Balance"
                    : paymentType ===
                        "full"
                      ? "Full Payment"
                      : "Partial Payment"}
                </div>
              </div>
            </div>
          </div>

          {/* =============================================
              ERROR
          ============================================= */}
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
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}
        <div
          className="
            flex items-center gap-3
            border-t border-[#E8D9CC]
            bg-white
            p-5
          "
        >
          <button
            onClick={onClose}
            disabled={loading}
            className="
              flex-1 rounded-2xl
              border border-[#E8D9CC]
              bg-white
              py-3
              text-sm font-medium
              text-[#4B3A30]
              transition
              hover:bg-[#FAF6F1]
              disabled:opacity-50
            "
          >
            Cancel
          </button>

          <button
            onClick={handlePay}
            disabled={
              loading ||
              payNowAmount <= 0
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
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {loading
              ? "Processing..."
              : `${payButtonLabel} • ₱${payNowAmount.toLocaleString()}`}
          </button>
        </div>
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
  strong?: boolean;
  capitalize?: boolean;
};

function SummaryRow({
  label,
  value,
  strong,
  capitalize,
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
          text-sm
          ${
            strong
              ? "font-semibold text-[#2B1D16]"
              : "text-[#2B1D16]"
          }
          ${capitalize ? "capitalize" : ""}
        `}
      >
        {value}
      </span>
    </div>
  );
}