"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getFurnitureById } from "@/services/furnitureService";
import type { FurnitureItemAdmin } from "@/types/furniture";

export function useFurnitureById(id?: string) {
  const [data, setData] = useState<FurnitureItemAdmin | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  // optional cache (very useful for admin edit reopening)
  const cacheRef = useRef<Record<string, FurnitureItemAdmin>>({});

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchFurniture = useCallback(async (targetId: string) => {
    const requestId = ++requestIdRef.current;

    if (!mountedRef.current) return;

    // ✅ instant cache hit (NO loading flicker)
    if (cacheRef.current[targetId]) {
      setData(cacheRef.current[targetId]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await getFurnitureById(targetId);

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      setData(res);

      cacheRef.current[targetId] = res;
    } catch (err) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      setError(
        err instanceof Error ? err.message : "Failed to fetch furniture"
      );
      setData(null);
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    fetchFurniture(id);
  }, [id, fetchFurniture]);

  return {
    data,
    loading,
    error,
    refetch: () => id && fetchFurniture(id),
  };
}