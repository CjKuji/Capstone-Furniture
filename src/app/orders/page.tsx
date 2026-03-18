"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import type {
  FurnitureSize,
  OrderStatus,
  FurnitureDetails,
  ConfigurationDetails,
  OrderWithDetails,
} from "@/types/furniture";

export default function CustomerOrders() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return setLoading(false);

        // 1️⃣ Fetch user orders
        const { data: ordersData, error: ordersError } = await supabase
          .from("furniture_orders")
          .select("id, total_price, status, created_at, configuration_id")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;
        if (!ordersData) return setLoading(false);

        const mappedOrders: OrderWithDetails[] = [];

        for (const order of ordersData) {
          let configuration: ConfigurationDetails | null = null;

          if (order.configuration_id) {
            // 2️⃣ Fetch configuration
            const { data: configData } = await supabase
              .from("furniture_configurations")
              .select("id, furniture_id, selected_size, selected_material_id, selected_color_id")
              .eq("id", order.configuration_id)
              .single();

            if (configData) {
              // 3️⃣ Fetch furniture
              const { data: furnitureData } = await supabase
                .from("furniture")
                .select("id, name, thumbnail_url, material_id, color_id")
                .eq("id", configData.furniture_id)
                .single();

              let furniture: FurnitureDetails = {
                id: "",
                name: "Unknown Furniture",
                thumbnail_url: "/placeholder.png",
                material: { id: "", name: "Unknown" },
                color: { id: "", name: "Unknown", hex_code: "#ffffff" },
              };

              if (furnitureData) {
                // 4️⃣ Fetch material
                const { data: materialData } = await supabase
                  .from("furniture_materials")
                  .select("id, name")
                  .eq("id", configData.selected_material_id ?? furnitureData.material_id)
                  .single();

                // 5️⃣ Fetch color
                const { data: colorData } = await supabase
                  .from("furniture_colors")
                  .select("id, name, hex_code")
                  .eq("id", configData.selected_color_id ?? furnitureData.color_id)
                  .single();

                furniture = {
                  id: furnitureData.id,
                  name: furnitureData.name,
                  thumbnail_url: furnitureData.thumbnail_url ?? "/placeholder.png",
                  material: materialData ?? { id: "", name: "Unknown" },
                  color: colorData ?? { id: "", name: "Unknown", hex_code: "#ffffff" },
                };
              }

              configuration = {
                selected_size: configData.selected_size ?? null,
                selected_color_id: configData.selected_color_id ?? furniture.color?.id ?? null,
                selected_material_id: configData.selected_material_id ?? furniture.material?.id ?? null,
                furniture,
              };
            }
          }

          mappedOrders.push({
            id: order.id,
            status: order.status,
            total_price: order.total_price,
            created_at: order.created_at,
            configuration,
          });
        }

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

  if (loading)
    return (
      <div className="min-h-screen font-sans bg-[#FFF8F0]">
        <Navbar />
        <div className="flex justify-center items-center h-screen text-[#4B3F3F] font-semibold text-lg">
          Loading your orders...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen font-sans bg-[#FFF8F0] text-[#4B3F3F]">
      <Navbar />
      <section className="py-16 px-8 text-center">
        <h1 className="text-4xl font-bold mb-4">My Orders</h1>
        <p className="text-[#6B584B] max-w-xl mx-auto">
          Track your custom furniture orders and view their production status.
        </p>
      </section>

      <section className="pb-16 px-8">
        {orders.length === 0 ? (
          <div className="text-center text-[#6B584B] text-lg">
            You have no orders yet.
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => {
              const config = order.configuration;
              const furniture = config?.furniture;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden transform transition hover:shadow-xl hover:-translate-y-1 flex flex-col"
                >
                  <img
  src={furniture?.thumbnail_url ?? "/placeholder.png"}
  alt={furniture?.name ?? "Furniture"}
  className="w-full h-64 object-cover"
/>
                  <div className="p-5 flex flex-col flex-1">
                    <h2 className="text-xl font-semibold mb-2">
                      {furniture?.name ?? "-"}
                    </h2>
                    <div className="mt-3 flex flex-col gap-2 text-[#6B584B] text-sm">
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
                          style={{
                            backgroundColor: furniture?.color?.hex_code ?? "#ffffff",
                          }}
                        />
                        {furniture?.color?.name ?? "-"}
                      </span>
                      <span>
                        <strong>Order Date:</strong>{" "}
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <span
                      className={`px-3 py-1 rounded-full font-semibold text-sm ${statusBadge(
                        order.status
                      )}`}
                    >
                      {order.status.replace("_", " ").toUpperCase()}
                    </span>
                    <button
                      onClick={() => router.push(`/orders/${order.id}`)}
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
    </div>
  );
}