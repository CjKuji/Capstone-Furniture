"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import type { FurnitureSize, OrderStatus } from "@/types/furniture";

// ---------------- TYPE ----------------
interface OrderWithDetails {
  id: string;
  status: OrderStatus;
  total_price: number;
  created_at: string;

  configuration: {
    selected_size: FurnitureSize | null;
    selected_color_id: string | null;
    selected_material_id: string | null;
    furniture: {
      id: string;
      name: string;
      thumbnail_url?: string | null;
      material?: { id: string; name: string } | null;
      color?: { id: string; name: string; hex_code?: string } | null;
    };
  } | null;
}

// Define the raw response type from Supabase
interface RawOrderResponse {
  id: string;
  status: OrderStatus;
  total_price: number;
  created_at: string;
  configuration?: {
    selected_size: FurnitureSize | null;
    selected_color_id: string | null;
    selected_material_id: string | null;
    furniture?: {
      id: string;
      name: string;
      thumbnail_url?: string | null;
      material?: { id: string; name: string }[];
      color?: { id: string; name: string; hex_code?: string }[];
    }[];
  }[];
}

export default function CustomerOrders() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /* ---------------- FETCH ORDERS ---------------- */
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("furniture_orders")
          .select(`
            id,
            status,
            total_price,
            created_at,
            configuration:configuration_id (
              selected_size,
              selected_color_id,
              selected_material_id,
              furniture:furniture_id (
                id,
                name,
                thumbnail_url,
                material:material_id(id,name),
                color:color_id(id,name,hex_code)
              )
            )
          `)
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // ----------- UNWRAP ARRAYS TO MATCH TYPE ----------------
        const mappedOrders: OrderWithDetails[] = (data ?? []).map((order: RawOrderResponse) => {
  const config = order.configuration?.[0] ?? null;
  const furniture = config?.furniture?.[0] ?? null;

  const material = furniture?.material?.[0] ?? null;
  const color = furniture?.color?.[0] ?? null;

  return {
    id: order.id,
    status: order.status,
    total_price: order.total_price,
    created_at: order.created_at,
    configuration: config
      ? {
          selected_size: config.selected_size,
          selected_color_id: config.selected_color_id,
          selected_material_id: config.selected_material_id,
          furniture: furniture
            ? {
                id: furniture.id,
                name: furniture.name,
                thumbnail_url: furniture.thumbnail_url,
                material,
                color,
              }
            : {
                id: "",
                name: "Unknown",
                thumbnail_url: "/placeholder.png",
              },
        }
      : null,
  };
});

        setOrders(mappedOrders);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const statusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_production":
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

  if (loading) {
    return (
      <div className="min-h-screen font-sans bg-[#FFF8F0]">
        <Navbar />
        <div className="flex justify-center items-center h-screen text-[#4B3F3F] font-semibold text-lg">
          Loading your orders...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans bg-[#FFF8F0] text-[#4B3F3F]">
      <Navbar />

      {/* HEADER */}
      <section className="py-16 px-8 text-center">
        <h1 className="text-4xl font-bold mb-4">My Orders</h1>
        <p className="text-[#6B584B] max-w-xl mx-auto">
          Track your custom furniture orders and view their production status.
        </p>
      </section>

      {/* ORDERS GRID */}
      <section className="pb-16 px-8">
        {!orders.length ? (
          <div className="text-center text-[#6B584B] text-lg">
            You have no orders yet.
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => {
              const config = order.configuration;
              const furniture = config?.furniture;
              const materialName = furniture?.material?.name ?? "-";
              const colorHex = furniture?.color?.hex_code ?? "#ffffff";
              const colorName = furniture?.color?.name ?? "-";

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden transform transition hover:shadow-xl hover:-translate-y-1 flex flex-col"
                >
                  {/* Thumbnail */}
                  <img
                    src={furniture?.thumbnail_url ?? "/placeholder.png"}
                    alt={furniture?.name ?? "Furniture"}
                    className="w-full h-64 object-cover"
                  />

                  {/* DETAILS */}
                  <div className="p-5 flex flex-col flex-1">
                    <h2 className="text-xl font-semibold mb-2">{furniture?.name}</h2>

                    <div className="mt-3 flex flex-col gap-2 text-[#6B584B] text-sm">
                      <span>
                        <strong>Size:</strong> {config?.selected_size ?? "-"} m
                      </span>
                      <span>
                        <strong>Material:</strong> {materialName}
                      </span>
                      <span className="flex items-center gap-2">
                        <strong>Color:</strong>
                        <span
                          className="w-5 h-5 rounded border"
                          style={{ backgroundColor: colorHex }}
                        />
                        {colorName}
                      </span>
                      <span>
                        <strong>Order Date:</strong>{" "}
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* STATUS + ACTION */}
                  <div className="p-4 flex justify-between items-center">
                    <span
                      className={`px-3 py-1 rounded-full font-semibold text-sm ${statusBadge(
                        order.status
                      )}`}
                    >
                      {order.status.replace("_", " ").toUpperCase()}
                    </span>

                    <button
                      onClick={() => router.push(`/pages/orders/${order.id}`)}
                      className="text-sm font-semibold text-[#A16B4C] hover:text-[#8C593F] transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="bg-[#FFF8F0] py-8 text-center text-[#4B3F3F] border-t border-[#E6D9C8]">
        <div className="mb-4">
          © {new Date().getFullYear()} Furniture3D. All rights reserved.
        </div>

        <div className="flex justify-center gap-4">
          <a href="#" className="hover:text-[#A16B4C] transition">
            Facebook
          </a>
          <a href="#" className="hover:text-[#A16B4C] transition">
            Instagram
          </a>
          <a href="#" className="hover:text-[#A16B4C] transition">
            Pinterest
          </a>
        </div>
      </footer>
    </div>
  );
}