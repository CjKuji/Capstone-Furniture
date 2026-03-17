"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminSidebar from "@/app/components/AdminSidebar";
import type { FurnitureSize, OrderStatus } from "@/types/furniture";
import type { User } from "@supabase/supabase-js";

// ---------------- TYPES ----------------
export interface AdminOrder {
  id: string;
  user_id: string;
  furniture_name: string;
  furniture_thumbnail: string | null;
  selected_size: FurnitureSize | null;
  selected_material: string | null;
  selected_color: string | null;
  color_hex: string | null;
  total_price: number | null;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
}

// Raw response type from Supabase
interface RawOrderResponse {
  id: string;
  user_id: string;
  total_price: number | null;
  status: OrderStatus;
  notes?: string | null;
  created_at: string;
  configuration?: {
    selected_size?: FurnitureSize | null;
    furniture?: {
      name: string;
      thumbnail_url?: string | null;
    }[];
    material?: { name: string }[];
    color?: { name: string; hex_code?: string }[];
  }[];
}

// ---------------- PAGE COMPONENT ----------------
export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState("orders");

  // ---------------- FETCH ORDERS ----------------
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      setUser(userData.user);

      const { data, error } = await supabase
        .from("furniture_orders")
        .select(`
          id,
          user_id,
          total_price,
          status,
          notes,
          created_at,
          configuration:configuration_id (
            selected_size,
            furniture:furniture_id (
              name,
              thumbnail_url
            ),
            material:furniture_materials!selected_material_id (
              name
            ),
            color:furniture_colors!selected_color_id (
              name,
              hex_code
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // ---------------- MAP RAW TO ADMIN ORDER ----------------
     const mappedOrders: AdminOrder[] = (data ?? []).map((order: RawOrderResponse) => {
  const config = order.configuration?.[0] ?? ({} as NonNullable<RawOrderResponse["configuration"]>[0]);
  const furniture = config.furniture?.[0] ?? ({} as NonNullable<typeof config.furniture>[0]);
  const material = config.material?.[0] ?? ({} as NonNullable<typeof config.material>[0]);
  const color = config.color?.[0] ?? ({} as NonNullable<typeof config.color>[0]);

  return {
    id: order.id,
    user_id: order.user_id,
    furniture_name: furniture.name ?? "Unknown Furniture",
    furniture_thumbnail: furniture.thumbnail_url ?? null,
    selected_size: config.selected_size ?? null,
    selected_material: material.name ?? null,
    selected_color: color.name ?? null,
    color_hex: color.hex_code ?? null,
    total_price: order.total_price ?? 0,
    status: order.status,
    notes: order.notes ?? null,
    created_at: order.created_at,
  };
});

      setOrders(mappedOrders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- AUTH & INITIAL FETCH ----------------
  useEffect(() => {
    fetchOrders();
  }, []);

  // ---------------- UPDATE STATUS ----------------
  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase
      .from("furniture_orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  // ---------------- HELPERS ----------------
  const statusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_production":
        return "bg-blue-100 text-blue-800";
      case "ready_to_claim":
        return "bg-indigo-100 text-indigo-800";
      case "claimed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
    }
  };

  const formatPrice = (price: number | null) =>
    price ? `₱${price.toLocaleString()}` : "TBD";

  if (!user)
    return (
      <div className="text-center mt-20 text-black font-semibold">
        Loading admin session...
      </div>
    );

  // ---------------- RENDER ----------------
  return (
    <div className="flex min-h-screen bg-white">
      <AdminSidebar activePage={activePage} setActivePage={setActivePage} />

      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-black mb-6">Orders</h1>

        {loading ? (
          <div className="text-center mt-10 text-black font-semibold">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center mt-10 text-black">
            No orders available.
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col hover:shadow-2xl transition"
              >
                {/* IMAGE */}
                <img
                  src={order.furniture_thumbnail ?? "/placeholder.png"}
                  alt={order.furniture_name}
                  className="w-full h-64 object-cover"
                />

                {/* DETAILS */}
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="text-xl font-semibold text-[#4B3F3F]">
                    {order.furniture_name}
                  </h2>

                  <p className="text-sm mt-2 text-[#6B584B]">
                    <strong>User:</strong> {order.user_id}
                  </p>

                  <div className="mt-3 flex flex-col gap-1 text-sm text-[#6B584B]">
                    <span>
                      <strong>Size:</strong> {order.selected_size ?? "-"}
                    </span>
                    <span>
                      <strong>Material:</strong> {order.selected_material ?? "-"}
                    </span>
                    <span className="flex items-center gap-2">
                      <strong>Color:</strong>
                      {order.color_hex && (
                        <span
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: order.color_hex }}
                        />
                      )}
                      {order.selected_color ?? "-"}
                    </span>
                    <span>
                      <strong>Total:</strong> {formatPrice(order.total_price)}
                    </span>
                    {order.notes && (
                      <span>
                        <strong>Notes:</strong> {order.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* STATUS */}
                <div className="p-4 border-t flex flex-col gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold w-fit ${statusBadge(
                      order.status
                    )}`}
                  >
                    {order.status.replaceAll("_", " ").toUpperCase()}
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {order.status === "pending" && (
                      <>
                        <button
                          className="px-3 py-1 bg-green-200 text-green-800 rounded"
                          onClick={() =>
                            updateStatus(order.id, "in_production")
                          }
                        >
                          Accept
                        </button>

                        <button
                          className="px-3 py-1 bg-red-200 text-red-800 rounded"
                          onClick={() => updateStatus(order.id, "rejected")}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {order.status === "in_production" && (
                      <button
                        className="px-3 py-1 bg-blue-200 text-blue-800 rounded"
                        onClick={() =>
                          updateStatus(order.id, "ready_to_claim")
                        }
                      >
                        Mark Ready
                      </button>
                    )}

                    {order.status === "ready_to_claim" && (
                      <button
                        className="px-3 py-1 bg-indigo-200 text-indigo-800 rounded"
                        onClick={() => updateStatus(order.id, "claimed")}
                      >
                        Mark Claimed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}