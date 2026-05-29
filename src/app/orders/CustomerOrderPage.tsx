"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  ShoppingBag,
  RefreshCw,
  CheckCircle2,
  XCircle,
  LoaderCircle,
} from "lucide-react";

import Navbar from "@/app/components/Navbar";
import OrderCard from "@/app/components/OrderCard";
import Reveal from "@/app/components/Reveal";
import PageTransition from "@/app/components/PageTransition";

import { useMyOrders } from "@/hooks/useUserOrders";
import { useConversationList } from "@/hooks/useConversationList";
import { useUser } from "@/hooks/useUser";

function CustomerOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Hook initializations
  const { user } = useUser();
  
  const {
    data: orders = [],
    isLoading,
    isError,
    isFetching,
    error,
    refetch,
  } = useMyOrders();

  const { conversations = [] } = useConversationList({
    userId: user?.id ?? "",
    role: "customer",
  });

  // 2. Memoized Mappers & Conversions
  const conversationMap = useMemo(() => {
    return new Map(conversations.map((c) => [c.order_id, c]));
  }, [conversations]);

  const paymentStatus = searchParams.get("payment");
  const paymentOrderId = searchParams.get("orderId");
  const hasPaymentModal = Boolean(paymentStatus && paymentOrderId);

  const closeModal = () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      url.searchParams.delete("orderId");
      window.history.replaceState({}, "", url.toString());
    }
  };

  /* ── DERIVED INITIAL LOADING GUARD ── */
  const isAuthLoading = user === undefined;

  if (isLoading || isAuthLoading) {
    return (
      <main className="min-h-screen bg-[#0F0A06] text-white">
        <Navbar />
        <div className="p-6 max-w-7xl mx-auto space-y-6 mt-6">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-48 bg-white/10 rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-white/5 border border-white/5 rounded-2xl"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ── ERROR BOUNDARY STATE ── */
  if (isError) {
    return (
      <main className="min-h-screen bg-[#0F0A06] text-white">
        <Navbar />
        <div className="flex flex-col justify-center items-center px-4 h-[75vh] text-center gap-5">
          <div className="bg-rose-500/10 p-4 border border-rose-500/20 rounded-full">
            <XCircle className="w-7 h-7 text-rose-500" />
          </div>
          <div className="space-y-1">
            <h2 className="font-bold text-xl tracking-tight text-white">Failed to synchronize application layout data</h2>
            <p className="text-white/40 text-xs max-w-sm mx-auto">
              {error?.message ?? "Failed to connect to order pipeline services"}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-5 py-2.5 rounded-xl transition"
          >
            <RefreshCw className="w-3 h-3" /> Retry Connection
          </button>
        </div>
      </main>
    );
  }

  /* ── UNAUTHORIZED BOUNDARY ── */
  if (!user?.id) {
    return (
      <main className="min-h-screen bg-[#0F0A06] text-white flex items-center justify-center">
        <div className="text-center text-white/40">
          <p className="text-sm tracking-wide font-medium">Security Clearance Exception: Access Denied</p>
        </div>
      </main>
    );
  }

  /* ── MAIN INTERFACE CANVAS ── */
  return (
    <PageTransition>
      <div className="bg-[#0F0A06] min-h-screen font-sans text-white relative selection:bg-[#D4A97A]/30">
        <Navbar />

        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="top-0 -right-40 absolute bg-[#7A4E2D]/10 blur-[100px] sm:blur-[140px] rounded-full w-[320px] sm:w-[500px] h-[320px] sm:h-[500px]" />
        </div>

        <main className="relative z-10 mx-auto px-4 sm:px-8 xl:px-12 py-8 sm:py-14 max-w-7xl">
          
          <header className="mb-8 sm:mb-12 flex items-end justify-between border-b border-white/5 pb-4">
            <div>
              <Reveal>
                <div className="inline-flex items-center gap-2 bg-white/5 mb-3 px-3 py-1 border border-white/10 rounded-full font-semibold text-[#D4A97A] text-[10px] uppercase tracking-widest">
                  <ShoppingBag className="w-3 h-3" />
                  Customer Portal
                </div>
                <h1 className="font-bold text-3xl sm:text-4xl tracking-tight leading-none">
                  My <span className="text-[#D4A97A]">Orders</span>
                </h1>
                <p className="mt-2 text-white/40 text-xs sm:text-sm max-w-xl">
                  Track your handcrafted pieces through every stage of the WoodForge process.
                </p>
              </Reveal>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/30 font-medium">
              {isFetching ? (
                <div className="flex items-center gap-1.5 text-[#D4A97A]">
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Syncing system data...</span>
                </div>
              ) : (
                <span>Live updates enabled</span>
              )}
            </div>
          </header>

          <section>
            {orders.length === 0 ? (
              <Reveal delay={0.15}>
                <div className="flex flex-col items-center justify-center py-32 text-center rounded-2xl border border-dashed border-white/5 bg-[#0B0704] px-4">
                  <Box className="w-8 h-8 text-white/20 mb-3" />
                  <p className="text-white/50 text-sm font-semibold tracking-tight">You haven't placed any orders yet.</p>
                  <button
                    onClick={() => router.push("/catalog")}
                    className="mt-4 text-[#D4A97A] text-xs font-semibold hover:text-[#C4976A] transition-colors underline underline-offset-4"
                  >
                    Browse our collection
                  </button>
                </div>
              </Reveal>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                {orders.map((order, idx) => (
                  <div key={`order-container-${order.id}`} className="contents">
                    <Reveal delay={idx * 0.04} from="bottom">
                      <OrderCard
                        key={`customer-order-${order.id}`}
                        order={order}
                        userId={user.id}
                        conversation={conversationMap.get(order.id)}
                      />
                    </Reveal>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        {hasPaymentModal && (
          <div className="fixed inset-0 z-[100] flex justify-center items-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-[#1C1209] border border-white/10 p-6 sm:p-8 rounded-2xl w-full max-w-sm sm:max-w-md text-center shadow-2xl max-h-[92vh] overflow-y-auto style-scrollbar transform scale-100 opacity-100 transition-all duration-300">

              {paymentStatus === "processing" && (
                <>
                  <div className="flex justify-center mb-5">
                    <LoaderCircle className="w-10 h-10 text-[#D4A97A] animate-spin" />
                  </div>
                  <h2 className="mb-1.5 font-bold text-xl text-white tracking-tight">Processing...</h2>
                  <p className="text-white/50 text-xs px-2">Verifying your transaction with the bank.</p>
                </>
              )}

              {paymentStatus === "success" && (
                <>
                  <div className="flex justify-center mb-5">
                    <div className="bg-green-500/10 p-3.5 border border-green-500/20 rounded-full">
                      <CheckCircle2 className="w-9 h-9 text-green-500" />
                    </div>
                  </div>
                  <h2 className="mb-1.5 font-bold text-xl text-white tracking-tight">Payment Received</h2>
                  <p className="text-white/50 text-xs leading-relaxed px-1">
                    Excellent choice. Your order has been moved to our craftsmen's queue.
                  </p>
                </>
              )}

              {paymentStatus === "cancelled" && (
                <>
                  <div className="flex justify-center mb-5">
                    <div className="bg-red-500/10 p-3.5 border border-red-500/20 rounded-full">
                      <XCircle className="w-9 h-9 text-red-500" />
                    </div>
                  </div>
                  <h2 className="mb-1.5 font-bold text-xl text-white tracking-tight">Payment Cancelled</h2>
                  <p className="text-white/50 text-xs leading-relaxed px-1">
                    The transaction was not completed. You can try again whenever you're ready.
                  </p>
                </>
              )}

              <button
                onClick={closeModal}
                className="bg-white/5 hover:bg-white/10 text-white font-semibold text-xs py-3 rounded-xl w-full mt-6 border border-white/5 transition-all active:scale-[0.99]"
              >
                Return to Orders
              </button>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

export default function CustomerOrdersPage() {
  return <CustomerOrdersContent />;
}