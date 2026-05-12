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

  const cacheRef = useRef<Record<string, FurnitureItemAdmin>>({});

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchFurniture = useCallback(async (targetId: string) => {
    const requestId = ++requestIdRef.current;

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
    } catch (e) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      setError(e instanceof Error ? e.message : "Failed to fetch furniture");
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
      setError(null);
      setLoading(false);
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