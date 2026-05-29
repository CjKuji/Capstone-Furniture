"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, RefreshCw, LoaderCircle } from "lucide-react";

import {
  useAdminOrders,
  useAdminOrderActions,
} from "@/hooks/useAdminOrders";

import {
  useConversationList,
  type Conversation,
} from "@/hooks/useConversationList";

import type { OrderStatus } from "@/types/enums";
import OrderAdminCard from "@/app/components/OrderAdminCard";
import { supabase } from "@/lib/supabase";

export default function AdminOrdersPage() {
  // isFetching detects background validation calls silently
  const { data: orders = [], isLoading, isError, isFetching } = useAdminOrders();
  const { updateStatus } = useAdminOrderActions();

  /* ================= AUTH ================= */
  const [adminId, setAdminId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getAdmin = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!mounted) return;

        if (error || !data.user) {
          setAdminId(null);
        } else {
          setAdminId(data.user.id);
        }
      } catch (err) {
        console.error("ADMIN_AUTH_ERROR", err);
        if (mounted) setAdminId(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    getAdmin();
    return () => { mounted = false; };
  }, []);

  /* ================= CONVERSATIONS ================= */
  const { conversations } = useConversationList({
    userId: adminId ?? "",
    role: "admin",
  });

  const conversationMap = useMemo(() => {
    return new Map<string, Conversation>(
      conversations
        .filter((c): c is Conversation & { order_id: string } => !!c.order_id)
        .map((c) => [c.order_id, c])
    );
  }, [conversations]);

  /* ================= STATUS UPDATE ================= */
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateStatus({ orderId, status });
    } catch (error) {
      console.error("UPDATE_ORDER_STATUS_ERROR", error);
    }
  };

  /* ================= INITIAL HARD LOADING BLOCKS ================= */
  // Notice that we only display the pulse layout placeholder on initial, non-cached mounting states!
  if ((isLoading && !isFetching) || authLoading) {
    return (
      <main className="min-h-screen bg-[#0F0A06] text-white p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 bg-white/10 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 bg-white/5 border border-white/5 rounded-2xl"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  /* ================= ERROR ================= */
  if (isError) {
    return (
      <main className="min-h-screen bg-[#0F0A06] text-white p-6 flex items-center justify-center">
        <div className="text-center text-rose-400">
          <p className="text-sm font-medium">Failed to synchronize application layout data records.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 py-2.5 rounded-xl transition"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Connection
          </button>
        </div>
      </main>
    );
  }

  /* ================= UNAUTHORIZED ================= */
  if (!adminId) {
    return (
      <main className="min-h-screen bg-[#0F0A06] text-white flex items-center justify-center">
        <div className="text-center text-white/40">
          <p className="text-sm tracking-wide font-medium">Security Clearance Exception: Access Denied</p>
        </div>
      </main>
    );
  }

  /* ================= MAIN APPLICATION UI RENDER CANVAS ================= */
  return (
    <main className="min-h-screen bg-[#0F0A06] text-white p-6 space-y-6">

      {/* HEADER SECTION CONTAINER */}
      <div className="flex items-end justify-between border-b border-white/5 pb-4 relative">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Orders Management
          </h1>
          <p className="text-xs sm:text-sm text-white/40 mt-0.5">
            Track and manage customer orders in real time
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/30 font-medium">
          {/* Transparent, zero-layout-shift sync loading wheel wrapper */}
          {isFetching ? (
            <div className="flex items-center gap-1.5 text-[#D4A97A]">
              <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing system data...</span>
            </div>
          ) : (
            <span>Live updates enabled</span>
          )}
        </div>
      </div>

      {/* CONDITIONAL SYSTEM DISPLAY: EMPTY VIEW VS GRID CARDS CANVAS */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center rounded-2xl border border-dashed border-white/5 bg-[#0B0704]">
          <Box className="w-8 h-8 text-white/20 mb-3" />
          <p className="text-white/50 text-sm font-semibold tracking-tight">No active orders discovered</p>
          <p className="text-white/25 text-xs mt-1 max-w-[280px] sm:max-w-none leading-relaxed">
            Database pipelines are active. Orders will display instantly when checkout routines trigger.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {orders.map((order) => (
            <OrderAdminCard
              key={order.id}
              order={order}
              adminId={adminId}
              conversation={conversationMap.get(order.id)}
              onUpdateStatus={updateOrderStatus}
            />
          ))}
        </div>
      )}
    </main>
  );
}