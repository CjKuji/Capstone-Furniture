"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/app/components/AdminSidebar";
import { supabase } from "@/lib/supabase";
import type {
  OrderWithDetails,
  ConfigurationDetails,
  OrderStatus,
  FurnitureSize,
} from "@/types/furniture";

// ---------------- TYPE FOR RAW SUPABASE RESPONSE ----------------
interface SupabaseOrderRaw {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_price: number;
  created_at: string;
  configuration?: {
    id: string;
    selected_size?: string | null;
    selected_color_id?: string | null;
    selected_material_id?: string | null;
    furniture?: {
      id: string;
      name?: string | null;
      thumbnail_url?: string | null;
      material?: { id?: string; name?: string | null };
      color?: { id?: string; name?: string | null; hex_code?: string | null };
    }[];
  }[];
}

// ---------------- STATUS BADGE ----------------
const statusBadge = (status: OrderStatus) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "in_production":
      return "bg-blue-100 text-blue-800";
    case "ready_to_claim":
      return "bg-green-100 text-green-800";
    case "claimed":
      return "bg-gray-100 text-gray-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// ---------------- COMPONENT ----------------
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------------- FETCH ALL ORDERS ----------------
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("furniture_orders")
        .select(`
          id,
          user_id,
          status,
          total_price,
          created_at,
          configuration:furniture_configurations (
            id,
            selected_size,
            selected_color_id,
            selected_material_id,
            furniture:furniture_id (
              id,
              name,
              thumbnail_url,
              material:material_id(id, name),
              color:color_id(id, name, hex_code)
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: OrderWithDetails[] = ((data ?? []) as SupabaseOrderRaw[]).map(
        (order) => {
          const configRaw = order.configuration?.[0] ?? null;
          const furnitureRaw = configRaw?.furniture?.[0] ?? null;

          const furniture = furnitureRaw
            ? {
                id: furnitureRaw.id,
                name: furnitureRaw.name ?? "Unknown Furniture",
                thumbnail_url: furnitureRaw.thumbnail_url ?? "/placeholder.png",
                material: {
                  id: furnitureRaw.material?.id ?? configRaw?.selected_material_id ?? "",
                  name: furnitureRaw.material?.name ?? "Unknown",
                },
                color: {
                  id: furnitureRaw.color?.id ?? configRaw?.selected_color_id ?? "",
                  name: furnitureRaw.color?.name ?? "Unknown",
                  hex_code: furnitureRaw.color?.hex_code ?? "#ffffff",
                },
              }
            : null;

          const configuration: ConfigurationDetails | null = configRaw
            ? {
                selected_size:
                  configRaw.selected_size &&
                  ["small", "medium", "large"].includes(configRaw.selected_size)
                    ? (configRaw.selected_size as FurnitureSize)
                    : null,
                selected_color_id: configRaw.selected_color_id ?? furniture?.color?.id ?? null,
                selected_material_id:
                  configRaw.selected_material_id ?? furniture?.material?.id ?? null,
                furniture,
              }
            : null;

          return {
            id: order.id,
            user_id: order.user_id,
            status: order.status,
            total_price: order.total_price,
            created_at: order.created_at,
            configuration,
          };
        }
      );

      setOrders(mapped);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- UPDATE ORDER STATUS ----------------
  const updateOrderStatus = async (
    orderId: string,
    status: "in_production" | "ready_to_claim" | "claimed" | "rejected"
  ) => {
    try {
      const { error } = await supabase.from("furniture_orders").update({ status }).eq("id", orderId);
      if (error) throw error;

      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch (err) {
      console.error("Failed to update order:", err);
      alert("Failed to update order status");
    }
  };

  // ---------------- EFFECT ----------------
  useEffect(() => {
    void fetchOrders();
  }, []);

  // ---------------- LOADING ----------------
  if (loading)
    return <div className="text-center mt-20 text-lg text-black">Loading orders...</div>;

  // ---------------- RENDER ----------------
  return (
    <div className="flex min-h-screen bg-white text-black">
      <AdminSidebar activePage="orders" setActivePage={() => {}} />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">All Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center mt-10 text-lg text-gray-700">No orders found.</div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => {
              const config = order.configuration;
              const furniture = config?.furniture;
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col"
                >
                  <img
                    src={furniture?.thumbnail_url ?? "/placeholder.png"}
                    alt={furniture?.name ?? "Furniture"}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-5 flex flex-col flex-1">
                    <h2 className="text-xl font-semibold">{furniture?.name ?? "Unknown Furniture"}</h2>
                    <div className="mt-2 flex flex-col gap-1 text-sm text-gray-700">
                      <span>
                        <strong>Size:</strong> {config?.selected_size ?? "-"}
                      </span>
                      <span>
                        <strong>Material:</strong> {furniture?.material?.name ?? "-"}
                      </span>
                      <span className="flex items-center gap-2">
                        <strong>Color:</strong>
                        <span
                          className="w-5 h-5 rounded border"
                          style={{ backgroundColor: furniture?.color?.hex_code ?? "#ffffff" }}
                        />
                        {furniture?.color?.name ?? "-"}
                      </span>
                      <span>
                        <strong>Order Date:</strong> {new Date(order.created_at).toLocaleDateString()}
                      </span>
                      <span>
                        <strong>Total:</strong> ${order.total_price?.toFixed(2) ?? "0.00"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <span
                      className={`px-3 py-1 rounded-full font-semibold text-sm ${statusBadge(order.status)}`}
                    >
                      {order.status.replace("_", " ").toUpperCase()}
                    </span>

                    <div className="flex gap-2">
                      {order.status === "pending" && (
                        <button
                          onClick={() => void updateOrderStatus(order.id, "in_production")}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Accept
                        </button>
                      )}
                      {order.status === "in_production" && (
                        <button
                          onClick={() => void updateOrderStatus(order.id, "ready_to_claim")}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Finish
                        </button>
                      )}
                      {order.status === "ready_to_claim" && (
                        <button
                          onClick={() => void updateOrderStatus(order.id, "claimed")}
                          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Mark as Claimed
                        </button>
                      )}
                      {order.status === "pending" && (
                        <button
                          onClick={() => void updateOrderStatus(order.id, "rejected")}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}