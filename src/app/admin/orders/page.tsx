"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminSidebar from "@/app/components/AdminSidebar";
import { User } from "@supabase/supabase-js";

type OrderStatus =
  | "pending"
  | "rejected"
  | "in_production"
  | "ready_to_claim"
  | "claimed";

interface AdminOrder {
  id: string;
  user_id: string;
  product_name: string;
  product_thumbnail: string | null;
  selected_size: string | null;
  selected_material: string | null;
  selected_color: string | null;
  color_hex: string | null;
  total_price: number | null;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
}

type RawOrder = {
  id: string;
  user_id: string;
  total_price: number | null;
  status: OrderStatus;
  notes: string | null;
  created_at: string;

  configuration: {
    selected_size: string | null;

    furniture: {
      name: string;
      thumbnail_url: string | null;
    } | null;

    material: {
      name: string;
    } | null;

    color: {
      name: string;
      hex_code: string;
    } | null;

  } | null;
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("orders");
  const [user, setUser] = useState<User | null>(null);

  /* ================= FETCH ORDERS ================= */

  const fetchOrders = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("furniture_orders")
      .select(`
        id,
        user_id,
        total_price,
        status,
        notes,
        created_at,
        configuration:furniture_configurations(
          selected_size,
          furniture:furniture(
            name,
            thumbnail_url
          ),
          material:furniture_materials!selected_material_id(
            name
          ),
          color:furniture_colors!selected_color_id(
            name,
            hex_code
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch orders error:", error);
      setLoading(false);
      return;
    }

  const mapped: AdminOrder[] = ((data ?? []) as RawOrder[]).map((order) => {
  const config = order.configuration;

  return {
    id: order.id,
    user_id: order.user_id,
    product_name: config?.furniture?.name ?? "Unknown furniture",
    product_thumbnail: config?.furniture?.thumbnail_url ?? null,
    selected_size: config?.selected_size ?? null,
    selected_material: config?.material?.name ?? null,
    selected_color: config?.color?.name ?? null,
    color_hex: config?.color?.hex_code ?? null,
    total_price: order.total_price,
    status: order.status,
    notes: order.notes,
    created_at: order.created_at
  };
});

    setOrders(mapped);
    setLoading(false);
  };

  /* ================= AUTH ================= */

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) return;

      setUser(data.user);
      await fetchOrders();
    };

    checkUser();
  }, []);

  /* ================= UPDATE STATUS ================= */

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

  /* ================= HELPERS ================= */

  const formatStatus = (status: string) =>
    status.replaceAll("_", " ").toUpperCase();

  const formatPrice = (price: number | null) =>
    price ? `₱${price.toLocaleString()}` : "TBD";

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

  if (!user)
    return (
      <div className="text-center mt-20 font-semibold text-black">
        Loading admin session...
      </div>
    );

  return (
    <div className="flex min-h-screen bg-white">
      <AdminSidebar activePage={activePage} setActivePage={setActivePage} />

      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-black mb-6">Orders</h1>

        {loading ? (
          <div className="text-center mt-10 font-semibold text-black">
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
                  src={order.product_thumbnail || "/placeholder.png"}
                  alt={order.product_name}
                  className="w-full h-64 object-cover"
                />

                {/* DETAILS */}

                <div className="p-5 flex-1">
                  <h2 className="text-xl font-semibold text-[#4B3F3F]">
                    {order.product_name}
                  </h2>

                  <p className="text-sm mt-2 text-[#6B584B]">
                    <strong>User:</strong> {order.user_id}
                  </p>

                  <div className="mt-3 flex flex-col gap-1 text-sm text-[#6B584B]">
                    <span>
                      <strong>Size:</strong> {order.selected_size}
                    </span>

                    <span>
                      <strong>Material:</strong> {order.selected_material}
                    </span>

                    <span className="flex items-center gap-2">
                      <strong>Color:</strong>

                      {order.color_hex && (
                        <span
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: order.color_hex }}
                        />
                      )}

                      {order.selected_color}
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
                    {formatStatus(order.status)}
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