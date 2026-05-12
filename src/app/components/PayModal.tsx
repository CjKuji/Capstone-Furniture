"use client";

import { useEffect, useState, useMemo } from "react";
import type { Order } from "@/types/order";

import { PaymentType, usePayment } from "@/hooks/usePayment";
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
  const { pay, loading, error, resetError } = usePayment();

  /**
   * DB SOURCE OF TRUTH
   */
  const { data: paymentsData } = usePaymentsQuery(order.id);

  const totalPaid = paymentsData?.totalPaid ?? 0;
  const hasPaidAnything = totalPaid > 0;

  /**
   * SAFE TOTAL
   */
  const safeTotalAmount = useMemo(() => {
    const value = Number(totalAmount);
    if (!value || value <= 0 || isNaN(value)) return 0;
    return value;
  }, [totalAmount]);

  /**
   * ONLY USED FOR FIRST PAYMENT
   */
  const [paymentType, setPaymentType] =
    useState<PaymentType>("partial");

  /**
   * BREAKDOWN
   */
  const breakdown = useMemo(() => {
    if (safeTotalAmount <= 0) {
      return {
        total: 0,
        totalPaid,
        payNow: 0,
      };
    }

    return calculatePaymentBreakdown(
      safeTotalAmount,
      totalPaid,
      paymentType
    );
  }, [safeTotalAmount, totalPaid, paymentType]);

  const payNowAmount = breakdown.payNow ?? 0;

  /**
   * SHOW OPTIONS ONLY ON FIRST PAYMENT
   */
  const showPaymentOptions = totalPaid === 0;

  /**
   * LABEL
   */
  const payButtonLabel = hasPaidAnything
    ? "Pay Remaining"
    : paymentType === "full"
      ? "Pay Full"
      : "Pay Partial";

  /**
   * ESC CLOSE
   */
  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  /**
   * SCROLL LOCK
   */
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /**
   * PAY
   */
  const handlePay = async () => {
    try {
      resetError();

      await pay({
        orderId: order.id,
        userId: order.user_id,
        type: hasPaidAnything ? "partial" : paymentType,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden border border-[#E8D9CC] bg-[#FAF7F2] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="border-b border-[#E8D9CC] bg-white px-5 py-4">
          <h2 className="text-sm font-semibold text-[#2B1D16]">
            Complete Payment
          </h2>

          <p className="mt-1 text-xs text-[#8C593F]">
            Order #{order.order_reference_code}
          </p>
        </div>

        {/* CONTENT */}
        <div className="space-y-4 p-5">

          {/* ORDER INFO */}
          <div className="space-y-2 rounded-2xl border border-[#E8D9CC] bg-white p-4">

            <div className="flex justify-between text-sm">
              <span className="text-[#6B5B52]">Customer</span>
              <span className="font-medium text-[#2B1D16]">
                {order.customer_name || "-"}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-[#6B5B52]">Method</span>
              <span className="capitalize text-[#2B1D16]">
                {order.delivery_method}
              </span>
            </div>

          </div>

          {/* PAYMENT OPTIONS (ONLY FIRST TIME) */}
          {showPaymentOptions && (
            <div className="rounded-2xl border border-[#E8D9CC] bg-white p-4">

              <label className="mb-2 block text-xs text-[#6B5B52]">
                Payment Option
              </label>

              <select
                value={paymentType}
                onChange={(e) =>
                  setPaymentType(e.target.value as PaymentType)
                }
                className="w-full rounded-xl border border-[#E8D9CC] bg-[#FAF7F2] px-3 py-2 text-sm text-[#2B1D16]"
              >
                <option value="partial">Partial Payment (50%)</option>
                <option value="full">Full Payment (100%)</option>
              </select>

              <p className="mt-2 text-[11px] text-[#8C593F]/80">
                Choose how you want to start your payment.
              </p>

            </div>
          )}

          {/* TOTAL */}
          <div className="rounded-2xl border border-[#E8D9CC] bg-[#F3E7DD] p-4">

            <div className="flex justify-between text-sm">
              <span className="text-[#6B5B52]">Total</span>
              <span className="font-medium text-[#2B1D16]">
                ₱{safeTotalAmount.toLocaleString()}
              </span>
            </div>

            <div className="mt-2 flex justify-between items-center">
              <span className="text-sm font-semibold text-[#2B1D16]">
                {hasPaidAnything ? "Pay Remaining" : "Pay Now"}
              </span>

              <span className="text-xl font-bold text-[#2B1D16]">
                ₱{payNowAmount.toLocaleString()}
              </span>
            </div>

          </div>

          {/* ERROR */}
          {error && (
            <p className="text-center text-xs text-red-500">
              {error}
            </p>
          )}

        </div>

        {/* ACTIONS */}
        <div className="flex gap-2 border-t border-[#E8D9CC] bg-white p-5">

          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-[#E8D9CC] py-2.5"
          >
            Cancel
          </button>

          <button
            onClick={handlePay}
            disabled={loading || payNowAmount <= 0}
            className="flex-1 rounded-xl bg-[#8C593F] py-2.5 font-semibold text-white"
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