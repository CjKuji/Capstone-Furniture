// hooks/useFurniture.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type {
  FurnitureItem,
  FurnitureItemAdmin,
  FurnitureRelation,
  Profile,
} from "../../types/furniture";

interface UseFurnitureOptions {
  isAdmin?: boolean;
}

type SupabaseAdminRow = {
  [key: string]: unknown;
  category?: FurnitureRelation;
  material?: FurnitureRelation;
  color?: FurnitureRelation;
  created_by?: Profile;
  size?: "small" | "medium" | "large" | null;
};

export const useFurniture = (options?: UseFurnitureOptions) => {
  const [furniture, setFurniture] = useState<FurnitureItemAdmin[] | FurnitureItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- FETCH ALL ---------------- */
  const fetchAllFurniture = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (options?.isAdmin) {
        // Admin: nested joins, cannot use generics safely
        const { data, error } = await supabase
          .from("furniture")
          .select(
            "*, category:category_id(*), material:material_id(*), color:color_id(*), created_by:id(*)"
          )
          .order("created_at", { ascending: false });

        if (error) throw error;

        const mapped: FurnitureItemAdmin[] = (data || []).map((item) => {
          const row = item as SupabaseAdminRow;
          return {
            ...row,
            category: row.category,
            material: row.material,
            color: row.color,
            created_by: row.created_by,
            size_numeric:
              row.size === "small" ? 0.5 : row.size === "medium" ? 1 : row.size === "large" ? 2 : null,
          };
        });

        setFurniture(mapped);
        return;
      }

      // Customer: simple, flat, only published furniture
      const { data, error } = await supabase
        .from<FurnitureItem>("furniture")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFurniture(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch furniture";
      console.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [options?.isAdmin]);

  /* ---------------- FETCH BY ID ---------------- */
  const fetchFurnitureById = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      if (options?.isAdmin) {
        const { data, error } = await supabase
          .from("furniture")
          .select(
            "*, category:category_id(*), material:material_id(*), color:color_id(*), created_by:id(*)"
          )
          .eq("id", id)
          .single();

        if (error) throw error;
        if (!data) return null;

        const row = data as SupabaseAdminRow;
        return {
          ...row,
          category: row.category,
          material: row.material,
          color: row.color,
          created_by: row.created_by,
          size_numeric:
            row.size === "small" ? 0.5 : row.size === "medium" ? 1 : row.size === "large" ? 2 : null,
        } as FurnitureItemAdmin;
      }

      const { data, error } = await supabase
        .from<FurnitureItem>("furniture")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch furniture by ID";
      console.error(message);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FETCH BY SLUG ---------------- */
  const fetchFurnitureBySlug = async (slug: string) => {
    setLoading(true);
    setError(null);

    try {
      if (options?.isAdmin) {
        const { data, error } = await supabase
          .from("furniture")
          .select(
            "*, category:category_id(*), material:material_id(*), color:color_id(*), created_by:id(*)"
          )
          .eq("slug", slug)
          .single();

        if (error) throw error;
        if (!data) return null;

        const row = data as SupabaseAdminRow;
        return {
          ...row,
          category: row.category,
          material: row.material,
          color: row.color,
          created_by: row.created_by,
          size_numeric:
            row.size === "small" ? 0.5 : row.size === "medium" ? 1 : row.size === "large" ? 2 : null,
        } as FurnitureItemAdmin;
      }

      const { data, error } = await supabase
        .from<FurnitureItem>("furniture")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch furniture by slug";
      console.error(message);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFurniture();
  }, [fetchAllFurniture]);

  return {
    furniture,
    loading,
    error,
    fetchAllFurniture,
    fetchFurnitureById,
    fetchFurnitureBySlug,
  };
};