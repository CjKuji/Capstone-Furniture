"use client";

import Navbar from "@/app/components/Navbar";
import { useMyOrders } from "@/hooks/useUserOrders";
import { useConversationList } from "@/hooks/useConversationList";
import OrderCard from "@/app/components/OrderCard";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useUser } from "@/hooks/useUser";

export default function CustomerOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user } = useUser();

  const {
    data: orders = [],
    isLoading,
    isError,
    error,
  } = useMyOrders();

  const { conversations } = useConversationList({
    userId: user?.id ?? "",
    role: "customer",
  });

  const conversationMap = useMemo(() => {
    return new Map(conversations.map((c) => [c.order_id, c]));
  }, [conversations]);

  const paymentStatus = searchParams.get("payment");
  const paymentOrderId = searchParams.get("orderId");

  const hasPaymentModal = Boolean(paymentStatus && paymentOrderId);

  const paymentModalState = useMemo(() => {
    if (!paymentStatus || !paymentOrderId) return null;

    const base = { orderId: paymentOrderId };

    switch (paymentStatus) {
      case "success":
        return { ...base, status: "success" };
      case "processing":
        return { ...base, status: "processing" };
      case "cancelled":
        return { ...base, status: "cancelled" };
      default:
        return null;
    }
  }, [paymentStatus, paymentOrderId]);

  const closeModal = () => {
    router.replace("/orders", { scroll: false });
  };

  /* =========================================================
     LOADING
  ========================================================= */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF6F1]">
        <Navbar />
        <div className="flex h-[70vh] items-center justify-center text-[#5A4636]">
          Loading your orders...
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */
  if (isError) {
    return (
      <div className="min-h-screen bg-[#FAF6F1]">
        <Navbar />
        <div className="flex h-[70vh] flex-col items-center justify-center text-red-600">
          <p className="font-medium">
            {error?.message ?? "Failed to load orders"}
          </p>

          <button
            onClick={() => router.refresh()}
            className="mt-4 rounded-xl bg-[#7A4E2D] px-5 py-2 text-white hover:bg-[#663D22] transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F1] text-[#3A2B22]">
      <Navbar />

      {/* =========================================================
         HERO (aligned with catalog style)
      ========================================================= */}
      <section className="mx-auto max-w-7xl px-6 pt-10 pb-6">
        <h1 className="text-4xl font-bold tracking-tight">
          My Orders
        </h1>

        <p className="mt-2 text-sm text-[#6A5646] max-w-2xl">
          Track your furniture journey — from design selection to production and delivery.
        </p>
      </section>

      {/* =========================================================
         ORDERS GRID
      ========================================================= */}
      <section className="mx-auto max-w-7xl px-6 pb-16">

        {orders.length === 0 ? (
          <div className="mt-20 text-center text-[#6A5646]">
            You don’t have any orders yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={{
                  ...order,
                  order_items: order.order_items ?? [],
                }}
                conversation={conversationMap.get(order.id)}
              />
            ))}
          </div>
        )}

      </section>

      {/* =========================================================
         PAYMENT MODAL (refined showroom style)
      ========================================================= */}
      {hasPaymentModal && paymentModalState && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

          <div className="w-[90%] max-w-md rounded-2xl bg-white border border-[#E8D7C8] shadow-2xl p-6 text-center">

            {paymentModalState.status === "processing" && (
              <>
                <h2 className="text-lg font-semibold text-[#3A2B22]">
                  Processing Payment
                </h2>
                <p className="mt-2 text-sm text-[#6A5646]">
                  We are confirming your payment with our system.
                </p>
              </>
            )}

            {paymentModalState.status === "success" && (
              <>
                <h2 className="text-lg font-semibold text-green-700">
                  Payment Successful
                </h2>
                <p className="mt-2 text-sm text-[#6A5646]">
                  Your order has been updated and sent to production.
                </p>
              </>
            )}

            {paymentModalState.status === "cancelled" && (
              <>
                <h2 className="text-lg font-semibold text-red-600">
                  Payment Cancelled
                </h2>
                <p className="mt-2 text-sm text-[#6A5646]">
                  No worries — you can retry anytime.
                </p>
              </>
            )}

            <button
              onClick={closeModal}
              className="mt-6 w-full rounded-xl bg-[#7A4E2D] px-4 py-2 text-white hover:bg-[#663D22] transition"
            >
              Close
            </button>

          </div>
        </div>
      )}
    </div>
  );
}