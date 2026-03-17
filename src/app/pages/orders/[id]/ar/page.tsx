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
        const { data, error } = await supabase
          .from("furniture")
          .select(`id, name, model_url`)
          .eq("id", furnitureId)
          .single();

        if (error) throw error;
        setFurniture(data);
      } catch (err) {
        console.error(err);
        setFurniture(null);
      } finally {
        setLoading(false);
      }
    };
    if (furnitureId) fetchFurniture();
  }, [furnitureId]);

  if (loading) return <div className="text-center py-20">Loading AR...</div>;
  if (!furniture) return <div className="text-center py-20">Furniture not found</div>;

  return (
    <div className="w-full h-screen bg-black">
      <button
        className="absolute top-4 left-4 z-50 px-4 py-2 bg-white rounded shadow"
        onClick={() => router.back()}
      >
        ← Back
      </button>

      <FurnitureARViewer
        modelUrl={furniture.model_url!}
        selectedSize={1} // Or map size if you want
      />
    </div>
  );
}