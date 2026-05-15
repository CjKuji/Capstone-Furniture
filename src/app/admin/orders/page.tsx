"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, RefreshCw } from "lucide-react";

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
  const { data: orders = [], isLoading, isError } = useAdminOrders();
  const { invalidateOrders } = useAdminOrderActions();

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

    return () => {
      mounted = false;
    };
  }, []);

  /* ================= CONVERSATIONS ================= */

  const { conversations } = useConversationList({
    userId: adminId ?? "",
    role: "admin",
  });

  const conversationMap = useMemo(() => {
    return new Map<string, Conversation>(
      conversations
        .filter(
          (c): c is Conversation & { order_id: string } =>
            !!c.order_id
        )
        .map((c) => [c.order_id, c])
    );
  }, [conversations]);

  /* ================= STATUS UPDATE ================= */

  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus
  ) => {
    const { error } = await supabase
      .from("orders")
      .update({ order_status: status })
      .eq("id", orderId);

    if (error) {
      console.error("UPDATE_ORDER_STATUS_ERROR", error);
      return;
    }

    invalidateOrders();
  };

  /* ================= LOADING ================= */

  if (isLoading || authLoading) {
    return (
      <main className="min-h-screen bg-[#0F0A06] text-white p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 bg-white/10 rounded" />
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
        <div className="text-center text-red-400">
          <p className="text-sm">Failed to load orders</p>

          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-2 text-xs bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-full"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
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
          <p className="text-sm">Unauthorized access</p>
        </div>
      </main>
    );
  }

  /* ================= EMPTY ================= */

  if (orders.length === 0) {
    return (
      <main className="min-h-screen bg-[#0F0A06] text-white p-6">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Box className="w-10 h-10 text-white/20 mb-3" />
          <p className="text-white/40 text-sm">No orders found</p>
          <p className="text-white/20 text-xs mt-1">
            Orders will appear here once customers start purchasing
          </p>
        </div>
      </main>
    );
  }

  /* ================= MAIN UI ================= */

  return (
    <main className="min-h-screen bg-[#0F0A06] text-white p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-end justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Orders Management
          </h1>
          <p className="text-sm text-white/40">
            Track and manage customer orders in real time
          </p>
        </div>

        <div className="text-xs text-white/30">
          Live updates enabled
        </div>
      </div>

      {/* GRID */}
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
    </main>
  );
}