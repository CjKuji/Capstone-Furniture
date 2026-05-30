"use client";

import { useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
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
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

/* ─────────────────────────────────────────────────────────────
   PAYMENT MODAL — the ONLY component allowed to call
   useSearchParams(). It lives in its own component so the
   parent tree never suspends when search params are read.
   The inline <Suspense fallback={null}> in CustomerOrdersContent
   catches any suspension here without touching Navbar or the
   order grid at all.
───────────────────────────────────────────────────────────── */
function PaymentSuccessModal() {
  const searchParams = useSearchParams();

  const paymentStatus = searchParams.get("payment");
  const paymentOrderId = searchParams.get("orderId");
  const hasPaymentModal = Boolean(paymentStatus === "success" && paymentOrderId);

  useBodyScrollLock(hasPaymentModal);

  const closeModal = () => {
    /**
     * DO NOT call router.refresh() here.
     * router.refresh() invalidates the entire Next.js cache and causes
     * isLoading/isFetching to spike, triggering the loading guard and
     * flashing the skeleton behind the modal closing.
     * The Supabase realtime subscription in OrderCard keeps data fresh.
     */
    const url = new URL(window.location.href);
    url.searchParams.delete("payment");
    url.searchParams.delete("orderId");
    window.history.replaceState({}, "", url.toString());
  };

  if (!hasPaymentModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center bg-black/90 backdrop-blur-xl p-4">
      <div className="bg-[#1C1209] border border-[#D4A97A]/30 p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4A97A] to-transparent opacity-50" />

        <div className="mb-6 flex justify-center">
          <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
        </div>

        <h2 className="text-white font-bold text-xl tracking-tight mb-2">
          Payment Confirmed
        </h2>
        <p className="text-white/40 text-xs mb-8 leading-relaxed">
          Transaction successful for Order{" "}
          <span className="text-[#D4A97A] font-mono">
            {paymentOrderId?.slice(-6).toUpperCase()}
          </span>
          . Your manifest has been updated.
        </p>

        <button
          onClick={closeModal}
          className="w-full py-4 bg-[#D4A97A] hover:bg-white text-[#0F0A06] text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all active:scale-[0.98]"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE CONTENT
   No useSearchParams here. No outer Suspense in page.tsx.
   The only Suspense is the inline one wrapping PaymentSuccessModal.
───────────────────────────────────────────────────────────── */
function CustomerOrdersContent() {
  const router = useRouter();

  const { user } = useUser();

  const {
    data: orders = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useMyOrders();

  const { conversations = [] } = useConversationList({
    userId: user?.id ?? "",
    role: "customer",
  });

  const conversationMap = useMemo(() => {
    return new Map(conversations.map((c) => [c.order_id, c]));
  }, [conversations]);

  /* ── LOADING & AUTH GUARDS ── */
  const isAuthLoading = user === undefined;

  /**
   * SHOW SKELETON ONLY ON TRUE FIRST LOAD
   *
   * Guard: orders.length === 0 && (isLoading || isAuthLoading)
   *
   * Why include `orders.length === 0`:
   * With placeholderData: (prev) => prev in the hook, React Query keeps
   * the previous data array in place during any refetch/invalidation, so
   * `orders` will never be empty once it has loaded at least once.
   * This means the skeleton only shows when we genuinely have no data yet.
   *
   * Why NOT use `isFetching`:
   * isFetching is true during background syncs (realtime invalidations,
   * manual refetch calls) even when orders.length > 0. Using it here
   * would flash the skeleton over perfectly good rendered cards.
   *
   * Why `isLoading` is safe here:
   * React Query sets isLoading true only when fetching with an empty cache
   * (no prior data). Once the first fetch completes, isLoading is
   * permanently false for this query key — even across re-renders,
   * navigations, or background refetches triggered by invalidation.
   */
  const showInitialLoading = orders.length === 0 && (isLoading || isAuthLoading);

  if (showInitialLoading) {
    return (
      <main className="min-h-screen bg-[#0F0A06] text-white">
        <Navbar />
        <div className="p-6 max-w-7xl mx-auto space-y-6 mt-6">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-48 bg-white/10 rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 bg-white/5 border border-white/5 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (isError && orders.length === 0) {
    return (
      <main className="min-h-screen bg-[#0F0A06] text-white">
        <Navbar />
        <div className="flex flex-col justify-center items-center px-4 h-[75vh] text-center gap-5">
          <div className="bg-rose-500/10 p-4 border border-rose-500/20 rounded-full">
            <XCircle className="w-7 h-7 text-rose-500" />
          </div>
          <h2 className="font-bold text-xl text-white">Connection Error</h2>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 text-[10px] font-black uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 px-5 py-2.5 rounded-xl"
          >
            <RefreshCw className="w-3 h-3" /> Retry Connection
          </button>
        </div>
      </main>
    );
  }

  return (
    <PageTransition>
      <div className="bg-[#0F0A06] min-h-screen font-sans text-white relative selection:bg-[#D4A97A]/30">
        <Navbar />

        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="top-0 -right-40 absolute bg-[#7A4E2D]/10 blur-[100px] sm:blur-[140px] rounded-full w-[320px] sm:w-[500px] h-[320px] sm:h-[500px]" />
        </div>

        <main className="relative z-10 mx-auto px-4 sm:px-8 xl:px-12 py-4 sm:py-6 max-w-7xl">
          <header className="mb-4 sm:mb-6 flex items-end justify-between border-b border-white/5 pb-3">
            <div>
              <Reveal>
                <div className="inline-flex items-center gap-2 bg-white/5 mb-2 px-3 py-1 border border-white/10 rounded-full font-semibold text-[#D4A97A] text-[9px] uppercase tracking-widest">
                  <ShoppingBag className="w-3 h-3" /> Customer Portal
                </div>
                <h1 className="font-bold text-2xl sm:text-3xl tracking-tight leading-none">
                  My <span className="text-[#D4A97A]">Orders</span>
                </h1>
              </Reveal>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-white/30 font-medium">
              {isFetching ? (
                <div className="flex items-center gap-1.5 text-[#D4A97A]">
                  <LoaderCircle className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">Syncing...</span>
                </div>
              ) : (
                <span className="opacity-60 uppercase tracking-widest text-[9px]">
                  Live Updates
                </span>
              )}
            </div>
          </header>

          <section>
            {orders.length === 0 ? (
              <Reveal delay={0.15}>
                <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-white/5 bg-[#0B0704] px-4">
                  <Box className="w-8 h-8 text-white/20 mb-3" />
                  <p className="text-white/50 text-sm font-semibold tracking-tight">
                    You haven&apos;t placed any orders yet.
                  </p>
                  <button
                    onClick={() => router.push("/catalog")}
                    className="mt-4 text-[#D4A97A] text-xs font-semibold underline underline-offset-4"
                  >
                    Browse our collection
                  </button>
                </div>
              </Reveal>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                {orders.map((order, idx) => (
                  <div key={order.id} className="contents">
                    <Reveal delay={idx * 0.02} from="bottom">
                      <OrderCard
                        order={order}
                        userId={user?.id ?? ""}
                        conversation={conversationMap.get(order.id)}
                      />
                    </Reveal>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        {/*
          PaymentSuccessModal is the ONLY consumer of useSearchParams.
          Its own Suspense fallback={null} means if it suspends, nothing
          visible happens — no outer Suspense boundary can catch it and
          flash "Synchronizing Manifest..." or remount the Navbar.
        */}
        <Suspense fallback={null}>
          <PaymentSuccessModal />
        </Suspense>
      </div>
    </PageTransition>
  );
}

export default function CustomerOrdersPage() {
  return <CustomerOrdersContent />;
}