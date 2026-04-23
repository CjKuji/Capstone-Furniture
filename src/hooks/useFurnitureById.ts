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

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* =========================================================
     FETCH (RACE SAFE)
  ========================================================= */

  const fetchFurniture = useCallback(async (targetId: string) => {
    const requestId = ++requestIdRef.current;

    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const res = await getFurnitureById(targetId);

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      setData(res);
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

  /* =========================================================
     EFFECT
  ========================================================= */

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    fetchFurniture(id);
  }, [id, fetchFurniture]);

  /* =========================================================
     API
  ========================================================= */

  return {
    data,
    loading,
    error,
    refetch: () => id && fetchFurniture(id),
  };
}