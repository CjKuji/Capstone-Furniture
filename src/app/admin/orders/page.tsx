"use client";

import { useEffect, useMemo, useState } from "react";

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

/* ========================================================= */

export default function AdminOrdersPage() {
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useAdminOrders();

  const { invalidateOrders } = useAdminOrderActions();

  /* =========================================================
     ADMIN AUTH
  ========================================================= */

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
      } catch (error) {
        console.error("ADMIN_AUTH_ERROR", error);

        if (mounted) {
          setAdminId(null);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };

    getAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     CONVERSATIONS
  ========================================================= */

  const { conversations } = useConversationList({
    userId: adminId ?? "",
    role: "admin",
  });

  /* =========================================================
     MAP: order_id -> conversation
  ========================================================= */

  const conversationMap = useMemo(() => {
    return new Map<string, Conversation>(
      conversations
        .filter(
          (
            conversation
          ): conversation is Conversation & {
            order_id: string;
          } => !!conversation.order_id
        )
        .map((conversation) => [
          conversation.order_id,
          conversation,
        ])
    );
  }, [conversations]);

  /* =========================================================
     UPDATE ORDER STATUS
  ========================================================= */

  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus
  ): Promise<void> => {
    const { error } = await supabase
      .from("orders")
      .update({
        order_status: status,
      })
      .eq("id", orderId);

    if (error) {
      console.error("UPDATE_ORDER_STATUS_ERROR", error);
      return;
    }

    invalidateOrders();
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (isLoading || authLoading) {
    return (
      <div className="text-center mt-20">
        Loading orders...
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (isError) {
    return (
      <div className="text-center mt-20 text-red-500">
        Failed to load orders
      </div>
    );
  }

  /* =========================================================
     UNAUTHORIZED
  ========================================================= */

  if (!adminId) {
    return (
      <div className="text-center mt-20 text-red-500">
        Unauthorized (No admin session)
      </div>
    );
  }

  /* =========================================================
     EMPTY
  ========================================================= */

  if (orders.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">
          All Orders
        </h1>

        <div className="text-center mt-10">
          No orders found
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        All Orders
      </h1>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}