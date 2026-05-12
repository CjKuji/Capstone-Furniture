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

  /**
   * USER
   */
  const { user } = useUser();

  /**
   * ORDERS
   */
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
  } = useMyOrders();

  /**
   * CONVERSATIONS
   */
  const { conversations } = useConversationList({
    userId: user?.id ?? "",
    role: "customer",
  });

  /**
   * MAP
   */
  const conversationMap = useMemo(() => {
    return new Map(conversations.map((c) => [c.order_id, c]));
  }, [conversations]);

  /**
   * PAYMENT STATE (URL)
   */
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

  /**
   * CLOSE MODAL
   */
  const closeModal = () => {
    router.replace("/orders", { scroll: false });
  };

  /**
   * LOADING
   */
  if (isLoading) {
    return (
      <div className="min-h-screen font-sans bg-[#FFF8F0]">
        <Navbar />
        <div className="flex justify-center items-center h-[70vh] text-[#4B3F3F] font-semibold">
          Loading your orders...
        </div>
      </div>
    );
  }

  /**
   * ERROR
   */
  if (isError) {
    return (
      <div className="min-h-screen font-sans bg-[#FFF8F0]">
        <Navbar />
        <div className="flex justify-center items-center h-[70vh] text-red-600 font-semibold">
          {error?.message ?? "Failed to load orders"}
        </div>
      </div>
    );
  }

  /**
   * UI
   */
  return (
    <div className="min-h-screen font-sans bg-[#FFF8F0] text-[#4B3F3F]">
      <Navbar />

      {/* HERO */}
      <section className="py-16 px-8 text-center">
        <h1 className="text-4xl font-bold mb-4">My Orders</h1>
        <p className="text-[#6B584B] max-w-xl mx-auto">
          Track your furniture orders, quotation status, and production progress.
        </p>
      </section>

      {/* ORDERS */}
      <section className="pb-16 px-8">
        {orders.length === 0 ? (
          <div className="text-center text-[#6B584B] text-lg">
            You have no orders yet.
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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

      {/* PAYMENT MODAL */}
      {hasPaymentModal && paymentModalState && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[90%] max-w-md shadow-lg text-center">

            {paymentModalState.status === "processing" && (
              <>
                <h2 className="text-lg font-semibold mb-2">
                  Processing Payment...
                </h2>
                <p className="text-sm text-gray-600">
                  We are confirming your payment.
                </p>
              </>
            )}

            {paymentModalState.status === "success" && (
              <>
                <h2 className="text-lg font-semibold mb-2 text-green-600">
                  Payment Successful
                </h2>
                <p className="text-sm text-gray-600">
                  Your order has been updated successfully.
                </p>
              </>
            )}

            {paymentModalState.status === "cancelled" && (
              <>
                <h2 className="text-lg font-semibold mb-2 text-red-600">
                  Payment Cancelled
                </h2>
                <p className="text-sm text-gray-600">
                  You can try again anytime.
                </p>
              </>
            )}

            <button
              onClick={closeModal}
              className="mt-4 bg-black text-white px-4 py-2 rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}