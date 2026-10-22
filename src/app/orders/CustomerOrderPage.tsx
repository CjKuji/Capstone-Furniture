"use client";

import { useEffect, useMemo, Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  Box,
  ShoppingBag,
  RefreshCw,
  CheckCircle2,
  LoaderCircle,
  LogIn,
} from "lucide-react";

import OrderCard from "@/app/components/OrderCard";
import Reveal from "@/app/components/Reveal";
import { useMyOrders } from "@/hooks/useUserOrders";
import { useConversationList } from "@/hooks/useConversationList";
import { useUser } from "@/hooks/useUser";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

/* ─────────────────────────────────────────────────────────────
    PAYMENT MODAL — Isolated Search Params Boundary
───────────────────────────────────────────────────────────── */
function PaymentSuccessModal() {
  const searchParams = useSearchParams();
  const [referenceCode, setReferenceCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const paymentStatus = searchParams.get("payment");
  const paymentOrderId = searchParams.get("orderId");
  const hasPaymentModal = Boolean(paymentStatus === "success" && paymentOrderId);

  useBodyScrollLock(hasPaymentModal);

  const closeModal = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("payment");
    url.searchParams.delete("paymentId");
    url.searchParams.delete("orderId");
    url.searchParams.delete("inquiryId");
    window.history.replaceState({}, "", url.toString());
    setReferenceCode(null);
    setIsLoading(true);
  };

  // Fetch reference code when modal is shown
  useEffect(() => {
    if (!hasPaymentModal || !paymentOrderId) return;

    const fetchReferenceCode = async () => {
      setIsLoading(true);
      try {
        const { supabase } = await import("@/lib/supabase");
        
        // Fetch order reference code
        const { data, error } = await supabase
          .from("orders")
          .select("order_reference_code")
          .eq("id", paymentOrderId)
          .single();
        
        if (!error && data?.order_reference_code) {
          setReferenceCode(data.order_reference_code);
        } else {
          setReferenceCode(null);
        }
      } catch (err) {
        console.error("Failed to fetch reference code:", err);
        setReferenceCode(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferenceCode();
  }, [hasPaymentModal, paymentOrderId]);

  if (!hasPaymentModal) return null;

  const displayCode = referenceCode || paymentOrderId?.slice(-6).toUpperCase() || "";

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center bg-[var(--overlay)] backdrop-blur-sm p-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-70" />

        <div className="mb-6 flex justify-center">
          <div className="bg-[var(--success-tint)] p-4 rounded-full border border-[var(--success)]/25">
            <CheckCircle2 className="w-10 h-10 text-[var(--success)]" />
          </div>
        </div>

        <h2 className="text-[var(--text)] font-bold text-xl tracking-tight mb-2">
          Payment Confirmed
        </h2>
        <p className="text-[var(--text-muted)] text-xs mb-8 leading-relaxed">
          Transaction successful for Order{" "}
          <span className="text-[var(--primary)] font-mono">
            {isLoading ? "..." : displayCode}
          </span>
          . Your manifest has been updated.
        </p>

        <button
          onClick={closeModal}
          className="w-full min-h-11 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] text-xs font-semibold uppercase tracking-[0.15em] rounded-xl transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
    MAIN PAGE CONTENT
───────────────────────────────────────────────────────────── */
function CustomerOrdersContent() {
  const router = useRouter();
  const { user } = useUser();
  const searchParams = useSearchParams();

  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useMyOrders();

  const { conversations = [] } = useConversationList({
    userId: user?.id ?? "",
    role: "customer",
  });

  // Balanced Synchronization Realtime Handler for Post-checkout hooks
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const paymentOrderId = searchParams.get("orderId");

    if (paymentStatus === "success" && paymentOrderId) {
      // 150ms debounce window protects against remote pipeline execution lag
      const syncTimeout = setTimeout(() => {
        refetch();
      }, 150);

      return () => clearTimeout(syncTimeout);
    }
  }, [searchParams, refetch]);

  const conversationMap = useMemo(() => {
    return new Map(conversations.map((c) => [c.order_id, c]));
  }, [conversations]);

  const isAuthLoading = user === undefined;

  const isUnauthenticated = (isError && error instanceof Error && 
    (error.message.toLowerCase().includes("auth") || 
     error.message.toLowerCase().includes("jwt") || 
     error.message.toLowerCase().includes("user_id") ||
     error.message.toLowerCase().includes("not logged in"))) || 
    (!isAuthLoading && !user);

  const showInitialLoading = orders.length === 0 && (isLoading || isAuthLoading) && !isUnauthenticated;

  /* HIGH DENSITY REFINED SHIMMER SKELETON */
  if (showInitialLoading) {
    return (
      <main className="customer-orders-page min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--accent)]/30">
        <div className="mx-auto px-4 sm:px-8 xl:px-12 py-6 sm:py-8 max-w-7xl">
          <div className="animate-pulse space-y-5">
            <div className="space-y-2 border-b border-[var(--border)] pb-4">
              <div className="h-5 w-32 bg-[var(--surface-alt)] rounded-full" />
              <div className="h-8 w-56 bg-[var(--surface-alt)] rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
              {Array.from({ length: 3 }).map((_, i) => (
                <div 
                  key={i} 
                  className="h-[25rem] bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="h-4 w-24 bg-[var(--surface-alt)] rounded" />
                      <div className="h-5 w-16 bg-[var(--surface-alt)] rounded" />
                    </div>
                    <div className="h-3 w-40 bg-[var(--surface-alt)] rounded" />
                    <div className="h-12 w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-10 w-full bg-[var(--surface-alt)] rounded-lg" />
                    <div className="flex gap-2">
                      <div className="h-8 flex-1 bg-[var(--surface-alt)] rounded-lg" />
                      <div className="h-8 flex-1 bg-[var(--surface-alt)] rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* GUEST OR EXPIRED SESSION FALLBACK STATE */
  if (isUnauthenticated) {
    return (
      <main className="customer-orders-page min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 rounded-full border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--primary)]">
            <LogIn className="w-8 h-8" />
          </div>
          <h2 className="font-bold text-xl text-[var(--text)] tracking-tight">Sign in to view your orders</h2>
          <p className="text-sm text-[var(--text-muted)] mt-2 max-w-sm leading-relaxed">
            Your session has expired or you are not signed in. Please sign in to view your order updates.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 text-xs font-semibold text-[var(--primary-foreground)] shadow-md transition-all hover:bg-[var(--primary-hover)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            Sign In to Account
          </button>
        </div>
      </main>
    );
  }

  /* CRITICAL INFRASTRUCTURE ERROR SYSTEM BLOCK */
  if (isError && orders.length === 0) {
    return (
      <main className="customer-orders-page min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <div className="flex min-h-[70vh] flex-col justify-center items-center px-4 text-center gap-4">
          <div className="rounded-full border border-[var(--danger)]/30 bg-[var(--danger-tint)] p-4">
            <RefreshCw className="w-7 h-7 text-[var(--danger)]" />
          </div>
          <h2 className="font-bold text-xl text-[var(--text)]">Couldn’t load your orders</h2>
          <p className="text-xs text-[var(--text-muted)] max-w-xs">
            {error instanceof Error ? error.message : "Error connecting to your remote inquiry database channels."}
          </p>
          <button
            onClick={() => refetch()}
            className="flex min-h-10 items-center gap-2 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-tint)] px-5 py-2.5 text-xs font-semibold text-[var(--danger)] transition-all hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <RefreshCw className="w-3 h-3" /> Retry Connection
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="customer-orders-page bg-[var(--bg)] min-h-screen font-sans text-[var(--text)] relative selection:bg-[var(--accent)]/30">
        {/* AMBIENT BACKGROUND GLOW */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="top-0 -right-40 absolute bg-[var(--primary)]/5 blur-[100px] sm:blur-[140px] rounded-full w-[320px] sm:w-[500px] h-[320px] sm:h-[500px]" />
        </div>

        {/* INTERACTIVE COMPOSITOR SUB-HEADER OVERLAY FOR DATA BACKGROUND SYNC STATES */}
        {isFetching && orders.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50 bg-[var(--surface)] border border-[var(--border)] text-[var(--primary)] text-[10px] font-bold uppercase px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 tracking-wider backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
            <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
            <span>Synchronizing Matrix...</span>
          </div>
        )}

        <main className="relative z-10 mx-auto px-4 sm:px-8 xl:px-12 py-6 sm:py-8 max-w-7xl">
          <header className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-end justify-between border-b border-[var(--border)] pb-4 gap-4">
            <div>
              <Reveal className="space-y-1">
                <div className="inline-flex items-center gap-2 bg-[var(--surface-alt)] mb-1 px-3 py-1 border border-[var(--border)] rounded-full font-semibold text-[var(--primary)] text-[9px] uppercase tracking-widest">
                  <ShoppingBag className="w-3 h-3" /> Customer Portal
                </div>
                <h1 className="font-bold text-2xl sm:text-3xl tracking-tight leading-tight">
                  My <span className="text-[var(--primary)]">Orders</span>
                </h1>
              </Reveal>
            </div>

            <div className="inline-flex min-h-9 items-center gap-2 self-start sm:self-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-[10px] text-[var(--text-muted)] font-medium">
              {!isFetching && (
                <span className="uppercase tracking-widest text-[9px]">
                  Live Updates Active
                </span>
              )}
            </div>
          </header>

          <section>
            {orders.length === 0 ? (
              <Reveal delay={0.15}>
                <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-10 text-center sm:py-12">
                  <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--primary)]">
                    <Box className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-tight text-[var(--text)]">
                      You haven’t placed any orders yet.
                    </p>
                    <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-[var(--text-muted)]">
                      Once you place an order, you can follow its progress here.
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/catalog")}
                    className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-xs font-semibold text-[var(--primary-foreground)] transition hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    Browse Designs
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Reveal>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
                {orders.map((order, idx) => (
                  <div key={order.id} className="contents">
                    <Reveal delay={idx * 0.01} from="bottom">
                      <OrderCard
                        order={order}
                        userId={user?.id ?? ""}
                        conversation={conversationMap.get(order.id) || undefined}
                      />
                    </Reveal>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        <Suspense fallback={null}>
          <PaymentSuccessModal />
        </Suspense>
      </div>
  );
}

export default function CustomerOrdersPage() {
  return (
    <Suspense fallback={null}>
      <CustomerOrdersContent />
    </Suspense>
  );
}