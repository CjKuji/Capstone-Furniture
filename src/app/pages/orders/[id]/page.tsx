"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import type { FurnitureSize, OrderStatus } from "../../../../types/furniture";

interface OrderDetails {
  id: string;
  status: OrderStatus;
  total_price: number | null;
  notes: string | null;
  created_at: string;

  configuration: {
    selected_size: FurnitureSize | null;

    furniture: {
      id: string;
      name: string;
      thumbnail_url: string | null;
      model_url: string | null;
    } | null;

    material: {
      name: string;
    } | null;

    color: {
      name: string;
      hex_code: string;
    } | null;
  } | null;
}

interface RawOrderResponse {
  id: string;
  status: OrderStatus;
  total_price: number | null;
  notes: string | null;
  created_at: string;

  configuration?: {
    selected_size: FurnitureSize | null;

    furniture?: {
      id: string;
      name: string;
      thumbnail_url: string | null;
      model_url: string | null;
    }[];

    material?: { name: string }[];
    color?: { name: string; hex_code: string }[];
  }[];
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [show3D, setShow3D] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("furniture_orders")
          .select(`
            id,
            status,
            total_price,
            notes,
            created_at,
            configuration:configuration_id (
              selected_size,
              furniture:furniture_id (
                id,
                name,
                thumbnail_url,
                model_url
              ),
              material:furniture_materials!selected_material_id(name),
              color:furniture_colors!selected_color_id(name,hex_code)
            )
          `)
          .eq("id", orderId)
          .single();

        if (error) throw error;

        const raw = data as RawOrderResponse;

        const config = raw.configuration?.[0] ?? null;
        const furniture = config?.furniture?.[0] ?? null;
        const material = config?.material?.[0] ?? null;
        const color = config?.color?.[0] ?? null;

        setOrder({
          id: raw.id,
          status: raw.status,
          total_price: raw.total_price,
          notes: raw.notes,
          created_at: raw.created_at,
          configuration: config
            ? {
                selected_size: config.selected_size,
                furniture,
                material,
                color
              }
            : null
        });

      } catch (err) {
        console.error("Failed to fetch order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  const formatStatus = (status: string) =>
    status.replaceAll("_", " ").toUpperCase();

  const formatPrice = (price: number | null) =>
    price ? `₱${price.toLocaleString()}` : "TBD";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]">
        <Navbar />
        <div className="flex justify-center items-center h-screen text-lg font-semibold text-[#4B3F3F]">
          Loading order...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]">
        <Navbar />
        <div className="flex justify-center items-center h-screen text-lg">
          Order not found
        </div>
      </div>
    );
  }

  const furniture = order.configuration?.furniture;
  const material = order.configuration?.material;
  const color = order.configuration?.color;

  return (
    <div className="min-h-screen bg-[#FFF8F0] text-[#4B3F3F] font-sans">
      <Navbar />

      <section className="py-16 text-center">
        <h1 className="text-4xl font-bold">Order Details</h1>
        <p className="text-[#6B584B]">Order ID: {order.id.slice(0, 8)}</p>
      </section>

      <section className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 px-8 pb-16">

        {/* DETAILS */}

        <div className="flex flex-col gap-4">

          <h2 className="text-2xl font-semibold">
            {furniture?.name}
          </h2>

          <div className="flex flex-col gap-2">

            <span>
              <strong>Size:</strong> {order.configuration?.selected_size ?? "-"}
            </span>

            <span>
              <strong>Material:</strong> {material?.name ?? "-"}
            </span>

            <span className="flex items-center gap-2">
              <strong>Color:</strong>

              {color?.hex_code && (
                <span
                  className="w-5 h-5 rounded border"
                  style={{ backgroundColor: color.hex_code }}
                />
              )}

              {color?.name}
            </span>

            <span>
              <strong>Status:</strong> {formatStatus(order.status)}
            </span>

            <span>
              <strong>Total Price:</strong> {formatPrice(order.total_price)}
            </span>

            <span>
              <strong>Order Date:</strong>{" "}
              {new Date(order.created_at).toLocaleDateString()}
            </span>

          </div>

          {/* ACTION BUTTONS */}

          <div className="flex gap-3 mt-6">

            {furniture?.model_url && (
              <button
                onClick={() => setShow3D(true)}
                className="bg-[#A16B4C] text-white px-5 py-2 rounded-lg hover:bg-[#8C593F]"
              >
                View 3D
              </button>
            )}

            {furniture?.model_url && (
              <button
                onClick={() => setShow3D(true)}
                className="bg-[#4B3F3F] text-white px-5 py-2 rounded-lg hover:bg-black"
              >
                View AR
              </button>
            )}

            {furniture && (
              <button
                onClick={() => router.push(`/furniture/${furniture.id}`)}
                className="border border-[#A16B4C] px-5 py-2 rounded-lg hover:bg-[#A16B4C] hover:text-white"
              >
                View Product
              </button>
            )}

          </div>

        </div>
      </section>
    </div>
  );
}