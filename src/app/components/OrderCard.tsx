"use client";

import { useState } from "react";
import type { Order } from "@/types/order";

import { useOrderViewModel } from "@/hooks/useOrderViewModel";
import OrderFullDetailModal from "@/app/components/OrderFullDetailModal";

export default function OrderCard({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);

  const { derived, isLoading } = useOrderViewModel(order.id);

  const items = order.order_items ?? [];
  const primaryItem = items[0];

  const furniture = primaryItem?.furniture_snapshot;
  const variant = primaryItem?.variant_snapshot;

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.total_price ?? 0),
    0
  );

  /**
   * =========================================================
   * SAFE DERIVED VALUES
   * =========================================================
   */
  const paymentStatus = derived?.paymentStatus ?? "loading";
  const fulfillmentStatus = derived?.fulfillmentStatus ?? "loading";
  const orderStatus = derived?.orderStatus ?? order.status;

  /**
   * =========================================================
   * CUSTOMER-FRIENDLY STATUS MAPS
   * =========================================================
   */

  const getPaymentUI = () => {
    switch (paymentStatus) {
      case "unpaid":
        return {
          label: "Awaiting Payment",
          color: "bg-yellow-100 text-yellow-800",
        };
      case "partially_paid":
        return {
          label: "Partially Paid",
          color: "bg-blue-100 text-blue-800",
        };
      case "fully_paid":
        return {
          label: "Fully Paid",
          color: "bg-green-100 text-green-800",
        };
      default:
        return {
          label: "Loading...",
          color: "bg-gray-100 text-gray-700",
        };
    }
  };

  const getOrderUI = () => {
    switch (orderStatus) {
      case "pending_review":
        return {
          label: "Order Received",
          desc: "We are reviewing your order",
          color: "bg-yellow-100 text-yellow-800",
        };
      case "in_review":
        return {
          label: "In Review",
          desc: "We are preparing your quote",
          color: "bg-blue-100 text-blue-800",
        };
      case "quoted":
        return {
          label: "Quotation Sent",
          desc: "Waiting for your approval",
          color: "bg-purple-100 text-purple-800",
        };
      case "accepted":
        return {
          label: "Order Confirmed",
          desc: "Preparing production",
          color: "bg-indigo-100 text-indigo-800",
        };
      case "processing":
        return {
          label: "In Production",
          desc: "Your item is being made",
          color: "bg-orange-100 text-orange-800",
        };
      case "ready":
        return {
          label: "Ready for Pickup",
          desc: "Your order is ready",
          color: "bg-green-100 text-green-800",
        };
      case "completed":
        return {
          label: "Completed",
          desc: "Order delivered successfully",
          color: "bg-gray-100 text-gray-800",
        };
      default:
        return {
          label: "Processing",
          desc: "",
          color: "bg-gray-100 text-gray-700",
        };
    }
  };

  const paymentUI = getPaymentUI();
  const orderUI = getOrderUI();

  return (
    <>
      {/* =====================================================
          CARD
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden">

        {/* =====================================================
            HEADER (STATUS SECTION)
        ====================================================== */}
        <div className="p-5 space-y-3">

          <div className="flex justify-between items-start">

            {/* ORDER STATUS */}
            <div>
              <span className={`px-3 py-1 text-xs rounded-full ${orderUI.color}`}>
                {orderUI.label}
              </span>

              <p className="text-xs text-gray-500 mt-1">
                {orderUI.desc}
              </p>
            </div>

            {/* DATE */}
            <span className="text-xs text-gray-400">
              {new Date(order.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* ORDER ID */}
          <div>
            <h2 className="text-base font-semibold">
              {order.order_reference_code || "Order Pending Code"}
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* =====================================================
            ITEMS
        ====================================================== */}
        <div className="px-5 pb-4 space-y-3">

          {furniture && (
            <div className="bg-gray-50 border rounded-xl p-3">
              <div className="flex justify-between">

                <div>
                  <p className="text-xs text-gray-500 uppercase">
                    Furniture
                  </p>

                  <p className="text-sm font-semibold">
                    {furniture.name}
                  </p>
                </div>

                <p className="text-sm font-semibold">
                  ₱{Number(furniture.base_price ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {variant && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <div className="flex justify-between">

                <div>
                  <p className="text-xs text-blue-600 uppercase">
                    Variant
                  </p>

                  <p className="text-sm font-semibold text-blue-900">
                    {variant.name ?? "Custom Variant"}
                  </p>
                </div>

                <p className="text-sm font-semibold text-blue-700">
                  +₱{Number(variant.price_adjustment ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* CUSTOMER INFO */}
          <div className="text-sm text-gray-600 space-y-1 pt-1">

            <div>
              <span className="font-medium">Customer:</span>{" "}
              {order.customer_name || "-"}
            </div>

            <div>
              <span className="font-medium">Phone:</span>{" "}
              {order.phone_number || "-"}
            </div>

            <div>
              <span className="font-medium">Delivery:</span>{" "}
              {order.delivery_address || "N/A"}
            </div>
          </div>

          {/* =====================================================
              PAYMENT SECTION (CLEARLY SEPARATED)
          ====================================================== */}
          <div className="border-t pt-3 space-y-2">

            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">
                Payment Status
              </span>

              <span className={`px-3 py-1 text-xs rounded-full ${paymentUI.color}`}>
                {paymentUI.label}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Items Total</span>
              <span className="font-medium">
                ₱{subtotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* =====================================================
            ACTION
        ====================================================== */}
        <div className="bg-gray-50 px-5 py-4">
          <button
            onClick={() => setOpen(true)}
            className="w-full bg-[#8C593F] text-white py-2.5 rounded-xl font-semibold hover:opacity-90 transition"
          >
            View Order Details
          </button>
        </div>
      </div>

      {/* MODAL */}
      <OrderFullDetailModal
        open={open}
        onClose={() => setOpen(false)}
        order={order}
      />
    </>
  );
}