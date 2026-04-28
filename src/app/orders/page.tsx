"use client";

import Navbar from "@/app/components/Navbar";
import { useMyOrders } from "@/hooks/useUserOrders";
import OrderCard from "@/app/components/OrderCard"; // ✅ NEW CLEAN COMPONENT

export default function CustomerOrdersPage() {
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
  } = useMyOrders();

  /*
  =========================================================
  LOADING
  =========================================================
  */
  if (isLoading) {
    return (
      <div className="min-h-screen font-sans bg-[#FFF8F0]">
        <Navbar />

        <div className="flex justify-center items-center h-[70vh] text-[#4B3F3F] font-semibold text-lg">
          Loading your orders...
        </div>
      </div>
    );
  }

  /*
  =========================================================
  ERROR
  =========================================================
  */
  if (isError) {
    return (
      <div className="min-h-screen font-sans bg-[#FFF8F0]">
        <Navbar />

        <div className="flex justify-center items-center h-[70vh] text-red-600 font-semibold text-lg">
          {error?.message || "Failed to load orders"}
        </div>
      </div>
    );
  }

  /*
  =========================================================
  PAGE
  =========================================================
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
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}