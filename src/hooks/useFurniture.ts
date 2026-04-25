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

/* =========================================================
   GLOBAL CACHE
========================================================= */

let CACHE: FurnitureItemAdmin[] | null = null;
let CACHE_TIME = 0;
let INFLIGHT: Promise<FurnitureItemAdmin[]> | null = null;

const CACHE_TTL = 1000 * 60 * 2;
const TIMEOUT_MS = 15000;

/* ========================================================= */

export function useFurniture() {
  const [data, setData] = useState<FurnitureItemAdmin[]>(
    () => CACHE ?? []
  );

  const [loading, setLoading] = useState<boolean>(() => !CACHE);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const didInitRef = useRef(false);

  /* =========================================================
     LIFECYCLE
  ========================================================= */

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* =========================================================
     CACHE VALIDATION
  ========================================================= */

  const isFresh = useCallback(() => {
    return (
      Array.isArray(CACHE) &&
      CACHE.length >= 0 &&
      Date.now() - CACHE_TIME < CACHE_TTL
    );
  }, []);

  /* =========================================================
     TIMEOUT WRAPPER
  ========================================================= */

  const withTimeout = <T,>(promise: Promise<T>) => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), TIMEOUT_MS)
      ),
    ]);
  };

  /* =========================================================
     FETCH ALL (FIXED STABILITY)
  ========================================================= */

  const fetchAll = useCallback(async (force = false) => {
    const requestId = ++requestIdRef.current;

    setError(null);

    /* IMPORTANT:
       If cache exists, NEVER blank UI first
    */
    if (!force && isFresh() && CACHE) {
      setData(CACHE);
      setLoading(false);
      return CACHE;
    }

    setLoading(true);

    try {
      if (!INFLIGHT) {
        INFLIGHT = withTimeout(getFurniture())
          .then((res) => {
            const result = res ?? [];

            CACHE = result;
            CACHE_TIME = Date.now();

            return result;
          })
          .finally(() => {
            INFLIGHT = null;
          });
      }

      const result = await INFLIGHT;

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return result;
      }

      /* 🔥 CRITICAL: only update if data actually differs */
      setData((prev) => {
        if (prev === result) return prev;
        return result;
      });

      return result;
    } catch (err) {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return [];
      }

      setError(
        err instanceof Error ? err.message : "Failed to load furniture"
      );

      setData([]);
      return [];
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [isFresh]);

  /* =========================================================
     INIT (FIXED: prevents double fetch + flicker)
  ========================================================= */

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    if (CACHE && CACHE.length > 0) {
      setData(CACHE);
      setLoading(false);
      return;
    }

    fetchAll(true);
  }, [fetchAll]);

  /* =========================================================
     CREATE
  ========================================================= */

  const create = useCallback(
    async (payload: FurnitureFormPayload, userId: string) => {
      const requestId = ++requestIdRef.current;

      setMutating(true);
      setError(null);

      try {
        const created = await createFurniture(payload, userId);

        if (!mountedRef.current || requestId !== requestIdRef.current) {
          return true;
        }

        CACHE = [created, ...(CACHE ?? [])];
        setData(CACHE);

        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create furniture"
        );
        return false;
      } finally {
        setMutating(false);
      }
    },
    []
  );

  /* =========================================================
     UPDATE
  ========================================================= */

  const update = useCallback(
    async (id: string, payload: FurnitureFormPayload) => {
      const requestId = ++requestIdRef.current;

      setMutating(true);
      setError(null);

      try {
        const updated = await updateFurniture(id, payload);

        if (!mountedRef.current || requestId !== requestIdRef.current) {
          return true;
        }

        CACHE = (CACHE ?? []).map((item) =>
          item.id === id ? updated : item
        );

        setData(CACHE);

        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update furniture"
        );
        return false;
      } finally {
        setMutating(false);
      }
    },
    []
  );

  /* =========================================================
     DELETE
  ========================================================= */

  const remove = useCallback(async (id: string) => {
    const requestId = ++requestIdRef.current;

    setMutating(true);
    setError(null);

    try {
      await deleteFurniture(id);

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return true;
      }

      CACHE = (CACHE ?? []).filter((i) => i.id !== id);
      setData(CACHE);

      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete furniture"
      );
      return false;
    } finally {
      setMutating(false);
    }
  }, []);

  /* ========================================================= */

  return {
    data,
    loading,
    mutating,
    error,

    create,
    update,
    remove,

    refetch: () => fetchAll(true),
  };
}