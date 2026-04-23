"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getFurniture,
  createFurniture,
  updateFurniture,
  deleteFurniture,
} from "@/services/furnitureService";

import type {
  FurnitureItemAdmin,
  FurnitureFormPayload,
} from "@/types/furniture";

export function useFurniture() {
  const [data, setData] = useState<FurnitureItemAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* =========================================================
     SAFE STATE
  ========================================================= */

  const safeSet = useCallback((fn: () => void) => {
    if (mountedRef.current) fn();
  }, []);

  /* =========================================================
     FETCH ALL (RACE SAFE)
  ========================================================= */

  const fetchAll = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    safeSet(() => {
      setLoading(true);
      setError(null);
    });

    try {
      const res = await getFurniture();

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      setData(res ?? []);
    } catch (err) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      setError(
        err instanceof Error ? err.message : "Failed to load furniture"
      );
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [safeSet]);

  /* =========================================================
     CREATE
  ========================================================= */

  const create = useCallback(
    async (payload: FurnitureFormPayload, userId: string) => {
      safeSet(() => {
        setMutating(true);
        setError(null);
      });

      try {
        const created = await createFurniture(payload, userId);

        if (!mountedRef.current) return false;

        // optimistic insert
        setData((prev) => [created, ...prev]);

        return true;
      } catch (err) {
        if (!mountedRef.current) return false;

        setError(
          err instanceof Error ? err.message : "Failed to create furniture"
        );
        return false;
      } finally {
        safeSet(() => setMutating(false));
      }
    },
    [safeSet]
  );

  /* =========================================================
     UPDATE
  ========================================================= */

  const update = useCallback(
    async (id: string, payload: FurnitureFormPayload) => {
      safeSet(() => {
        setMutating(true);
        setError(null);
      });

      try {
        const updated = await updateFurniture(id, payload);

        if (!mountedRef.current) return false;

        setData((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );

        return true;
      } catch (err) {
        if (!mountedRef.current) return false;

        setError(
          err instanceof Error ? err.message : "Failed to update furniture"
        );
        return false;
      } finally {
        safeSet(() => setMutating(false));
      }
    },
    [safeSet]
  );

  /* =========================================================
     DELETE
  ========================================================= */

  const remove = useCallback(
    async (id: string) => {
      safeSet(() => {
        setMutating(true);
        setError(null);
      });

      try {
        await deleteFurniture(id);

        if (!mountedRef.current) return false;

        setData((prev) => prev.filter((item) => item.id !== id));

        return true;
      } catch (err) {
        if (!mountedRef.current) return false;

        setError(
          err instanceof Error ? err.message : "Failed to delete furniture"
        );
        return false;
      } finally {
        safeSet(() => setMutating(false));
      }
    },
    [safeSet]
  );

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* =========================================================
     API
  ========================================================= */

  return {
    data,
    loading,
    mutating,
    error,
    create,
    update,
    remove,
    refetch: fetchAll,
  };
}