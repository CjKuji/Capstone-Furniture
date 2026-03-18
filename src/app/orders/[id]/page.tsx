"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/app/components/Navbar";
import Furniture3DViewer from "@/app/components/Furniture3DViewer";
import type {
  FurnitureSize,
  OrderStatus,
  FurnitureDetails,
  ConfigurationDetails,
  OrderWithDetails,
} from "@/types/furniture";

// ---------------- SIZE MAPPING ----------------
const sizeMap: Record<FurnitureSize, number> = {
  small: 0.5,
  medium: 1,
  large: 2,
};

function mapSizeToNumber(size: FurnitureSize | null | undefined): number {
  if (!size) return 1;
  return sizeMap[size] ?? 1;
}

// ---------------- EXTENDED TYPE FOR THIS PAGE ----------------
interface FurnitureDetailsFull extends FurnitureDetails {
  model_url: string;
  description?: string | null;
  material?: { id: string; name: string; texture_url?: string | null } | null;
  color?: { id: string; name: string; hex_code?: string } | null;
}

interface ConfigurationDetailsFull extends ConfigurationDetails {
  furniture: FurnitureDetailsFull | null;
}

interface OrderWithDetailsFull extends OrderWithDetails {
  configuration: ConfigurationDetailsFull | null;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderWithDetailsFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        // 1️⃣ Get current user
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return setLoading(false);

        // 2️⃣ Fetch the specific order
        const { data: orderData, error: orderError } = await supabase
          .from("furniture_orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (orderError) throw orderError;
        if (!orderData) {
          setOrder(null);
          return;
        }

        let configuration: ConfigurationDetailsFull | null = null;

        if (orderData.configuration_id) {
          // 3️⃣ Fetch configuration
          const { data: configData } = await supabase
            .from("furniture_configurations")
            .select("*")
            .eq("id", orderData.configuration_id)
            .single();

          if (configData) {
            // 4️⃣ Fetch furniture
            const { data: furnitureData } = await supabase
              .from("furniture")
              .select("*")
              .eq("id", configData.furniture_id)
              .single();

            let furniture: FurnitureDetailsFull | null = null;

            if (furnitureData) {
              // 5️⃣ Fetch material
              const { data: materialData } = await supabase
                .from("furniture_materials")
                .select("*")
                .eq("id", configData.selected_material_id ?? furnitureData.material_id)
                .single();

              // 6️⃣ Fetch color
              const { data: colorData } = await supabase
                .from("furniture_colors")
                .select("*")
                .eq("id", configData.selected_color_id ?? furnitureData.color_id)
                .single();

              furniture = {
                id: furnitureData.id,
                name: furnitureData.name,
                description: furnitureData.description ?? null,
                model_url: furnitureData.model_url,
                thumbnail_url: furnitureData.thumbnail_url ?? "/placeholder.png",
                material: materialData ?? { id: "", name: "Unknown", texture_url: null },
                color: colorData ?? { id: "", name: "Unknown", hex_code: "#ffffff" },
              };
            }

            configuration = {
              selected_size: configData.selected_size ?? null,
              selected_color_id: configData.selected_color_id ?? furniture?.color?.id ?? null,
              selected_material_id: configData.selected_material_id ?? furniture?.material?.id ?? null,
              furniture,
            };
          }
        }

        setOrder({
          id: orderData.id,
          status: orderData.status,
          total_price: orderData.total_price,
          created_at: orderData.created_at,
          configuration,
        });
      } catch (err) {
        console.error("Failed to fetch order:", err);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

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
          Loading order details...
        </div>
      </div>
    );

  if (!order)
    return (
      <div className="min-h-screen font-sans bg-[#FFF8F0] text-[#4B3F3F] flex flex-col items-center justify-center">
        <Navbar />
        <h2 className="text-xl font-semibold">Order not found</h2>
        <button
          className="mt-4 px-4 py-2 bg-[#A16B4C] text-white rounded hover:bg-[#8C593F]"
          onClick={() => router.back()}
        >
          Go Back
        </button>
      </div>
    );

  const config = order.configuration;
  const furniture = config?.furniture;

  return (
    <div className="min-h-screen font-sans bg-[#FFF8F0] text-[#4B3F3F]">
      <Navbar />

      <div className="max-w-7xl mx-auto p-8 flex flex-col md:flex-row gap-8">
        {/* LEFT: 3D Viewer */}
        <div className="flex-1 bg-white shadow-lg rounded-xl p-4 flex flex-col items-center justify-center">
          {furniture && (
            <Furniture3DViewer
  modelUrl={furniture.model_url}
  selectedColor={furniture.color?.hex_code}
  selectedMaterialTextureUrl={furniture.material?.texture_url ?? undefined}
  selectedSize={mapSizeToNumber(config?.selected_size ?? null)}
/>
          )}
        </div>

        {/* RIGHT: Order Info */}
        <div className="w-full md:w-96 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col gap-3 sticky top-20">
            <h1 className="text-2xl font-bold">{furniture?.name ?? "-"}</h1>
            <p className="text-[#6B584B] whitespace-pre-line break-words max-h-40 overflow-y-auto">
  {furniture?.description ?? "No description available"}
</p>
            <div className="flex flex-col gap-2 text-[#6B584B] text-sm mt-2">
              <span><strong>Size:</strong> {config?.selected_size ?? "-"}</span>
              <span><strong>Material:</strong> {furniture?.material?.name ?? "-"}</span>
              <span className="flex items-center gap-2">
                <strong>Color:</strong>
                <span
                  className="w-5 h-5 rounded border"
                  style={{ backgroundColor: furniture?.color?.hex_code ?? "#ffffff" }}
                />
                {furniture?.color?.name ?? "-"}
              </span>
              <span><strong>Total Price:</strong> ${order.total_price.toFixed(2)}</span>
              <span><strong>Order Date:</strong> {new Date(order.created_at).toLocaleDateString()}</span>
              <span
                className={`px-2 py-1 rounded-full w-max font-semibold text-sm ${statusBadge(order.status)}`}
              >
                {order.status.replace("_", " ").toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}