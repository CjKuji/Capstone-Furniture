"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Package, 
  ShoppingBag, 
  RefreshCcw, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ArrowLeft
} from "lucide-react";

import Navbar from "@/app/components/Navbar";
import OrderCard from "@/app/components/OrderCard";
import Reveal from "@/app/components/Reveal";
import PageTransition from "@/app/components/PageTransition";

import { useMyOrders } from "@/hooks/useUserOrders";
import { useConversationList } from "@/hooks/useConversationList";
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
    refetch,
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

  const closeModal = () => {
    router.replace("/orders", { scroll: false });
  };

  /* ═══════════════════════════════════════════════════════════
      RENDER HELPERS
     ═══════════════════════════════════════════════════════════ */

  if (isLoading) {
    return (
      <div className="bg-[#0F0A06] min-h-screen text-white">
        <Navbar />
        <div className="flex flex-col justify-center items-center h-[70vh]">
          <Loader2 className="mb-4 w-10 h-10 text-[#D4A97A] animate-spin" />
          <p className="text-white/40 tracking-widest uppercase text-xs">Retrieving your orders...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-[#0F0A06] min-h-screen text-white">
        <Navbar />
        <div className="flex flex-col justify-center items-center px-4 h-[70vh] text-center">
          <div className="bg-red-500/10 mb-6 p-4 border border-red-500/20 rounded-full">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="font-bold text-2xl">Something went wrong</h2>
          <p className="mt-2 text-white/50">{error?.message ?? "Failed to load orders"}</p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 bg-[#D4A97A] hover:bg-[#C4976A] mt-6 px-6 py-2.5 rounded-full font-semibold text-[#1C1209] transition"
          >
            <RefreshCcw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="bg-[#0F0A06] min-h-screen font-sans text-white">
        <Navbar />

        {/* background glow blobs (consistent with Home) */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="top-0 -right-40 absolute bg-[#7A4E2D]/10 blur-[120px] rounded-full w-[500px] h-[500px]" />
        </div>

        <main className="relative z-10 mx-auto px-4 sm:px-6 py-12 max-w-7xl">
          {/* Header Section */}
          <header className="mb-12">
            <Reveal>
              <div className="inline-flex items-center gap-2 bg-white/5 mb-4 px-3 py-1 border border-white/10 rounded-full font-medium text-[#D4A97A] text-xs uppercase tracking-widest">
                <ShoppingBag className="w-3.5 h-3.5" />
                Customer Portal
              </div>
              <h1 className="font-bold text-4xl sm:text-5xl tracking-tight">
                My <span className="text-[#D4A97A]">Orders</span>
              </h1>
              <p className="mt-4 max-w-2xl text-white/50 text-lg">
                Track your handcrafted pieces through every stage of the WoodForge process.
              </p>
            </Reveal>
          </header>

          {/* Orders Grid */}
          <section>
            {orders.length === 0 ? (
              <Reveal delay={0.2}>
                <div className="flex flex-col justify-center items-center bg-white/[0.02] py-20 border border-white/5 rounded-3xl text-center">
                  <Package className="mb-4 w-12 h-12 text-white/10" />
                  <p className="text-white/40">You haven't placed any orders yet.</p>
                  <button 
                    onClick={() => router.push('/catalog')}
                    className="mt-6 text-[#D4A97A] text-sm hover:underline"
                  >
                    Browse our collection
                  </button>
                </div>
              </Reveal>
            ) : (
              <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {orders.map((order, idx) => (
                  <Reveal key={order.id} delay={idx * 0.1} from="bottom">
                    <OrderCard
                      order={{
                        ...order,
                        order_items: order.order_items ?? [],
                      }}
                      conversation={conversationMap.get(order.id)}
                    />
                  </Reveal>
                ))}
              </div>
            )}
          </section>
        </main>

        {/* ═══════════════════════════════════════════════════════════
            PAYMENT MODAL (Revamped for Luxury/Dark UI)
           ═══════════════════════════════════════════════════════════ */}
        {hasPaymentModal && (
          <div className="fixed inset-0 z-50 flex justify-center items-center bg-[#0F0A06]/80 backdrop-blur-md p-4">
            <Reveal from="bottom">
              <div className="bg-[#1C1209] border-white/10 p-8 border rounded-3xl w-full max-w-md text-center shadow-2xl">
                {paymentStatus === "processing" && (
                  <>
                    <div className="flex justify-center mb-6">
                      <Loader2 className="w-12 h-12 text-[#D4A97A] animate-spin" />
                    </div>
                    <h2 className="mb-2 font-bold text-2xl">Processing...</h2>
                    <p className="text-white/50">Verifying your transaction with the bank.</p>
                  </>
                )}

                {paymentStatus === "success" && (
                  <>
                    <div className="flex justify-center mb-6">
                      <div className="bg-green-500/20 p-4 rounded-full">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                      </div>
                    </div>
                    <h2 className="mb-2 font-bold text-2xl text-white">Payment Received</h2>
                    <p className="text-white/50 text-sm">
                      Excellent choice. Your order has been moved to our craftsmen's queue.
                    </p>
                  </>
                )}

                {paymentStatus === "cancelled" && (
                  <>
                    <div className="flex justify-center mb-6">
                      <div className="bg-red-500/20 p-4 rounded-full">
                        <XCircle className="w-12 h-12 text-red-500" />
                      </div>
                    </div>
                    <h2 className="mb-2 font-bold text-2xl text-white">Payment Cancelled</h2>
                    <p className="text-white/50 text-sm">
                      The transaction was not completed. You can try again whenever you're ready.
                    </p>
                  </>
                )}

                <button
                  onClick={closeModal}
                  className="bg-white/5 hover:bg-white/10 mt-8 py-3 rounded-xl w-full font-semibold text-white transition"
                >
                  Return to Orders
                </button>
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </PageTransition>
  );
}