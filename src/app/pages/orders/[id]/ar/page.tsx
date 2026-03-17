"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FurnitureARViewer from "@/app/components/FurnitureARViewer";
import { supabase } from "@/lib/supabase";
import type { FurnitureItemAdmin } from "@/types/furniture";

export default function FurnitureARPage() {
  const router = useRouter();
  const params = useParams();
  const furnitureId = params?.id as string;

  const [furniture, setFurniture] = useState<FurnitureItemAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFurniture = async () => {
      try {
        // Fetch required fields for FurnitureItemAdmin
        const { data, error } = await supabase
          .from("furniture")
          .select(`
            id,
            name,
            model_url,
            is_published
          `)
          .eq("id", furnitureId)
          .single();

        if (error) throw error;

        if (!data) {
          setFurniture(null);
          return;
        }

        // Ensure type safety by matching FurnitureItemAdmin
        setFurniture({
          id: data.id,
          name: data.name,
          model_url: data.model_url,
          is_published: data.is_published,
        });
      } catch (err) {
        console.error("Failed to fetch furniture:", err);
        setFurniture(null);
      } finally {
        setLoading(false);
      }
    };

    if (furnitureId) fetchFurniture();
  }, [furnitureId]);

  if (loading)
    return (
      <div className="text-center py-20 text-white font-semibold">
        Loading AR...
      </div>
    );

  if (!furniture)
    return (
      <div className="text-center py-20 text-white font-semibold">
        Furniture not found
      </div>
    );

  return (
    <div className="w-full h-screen bg-black relative">
      <button
        className="absolute top-4 left-4 z-50 px-4 py-2 bg-white rounded shadow hover:bg-gray-200 transition"
        onClick={() => router.back()}
      >
        ← Back
      </button>

      <FurnitureARViewer
        modelUrl={furniture.model_url}
        selectedSize={1} // You can map size if needed
      />
    </div>
  );
}