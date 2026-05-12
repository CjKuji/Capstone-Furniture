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
  const [data, setData] = useState<FurnitureItemAdmin[]>(() => CACHE ?? []);
  const [loading, setLoading] = useState<boolean>(() => !CACHE);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const didInitRef = useRef(false);

  /* ========================================================= */

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ========================================================= */

  const isFresh = useCallback(() => {
    return (
      Array.isArray(CACHE) &&
      Date.now() - CACHE_TIME < CACHE_TTL
    );
  }, []);

  /* ========================================================= */

  const withTimeout = <T,>(promise: Promise<T>) =>
    Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), TIMEOUT_MS)
      ),
    ]);

  /* =========================================================
     FETCH ALL
  ========================================================= */

  const fetchAll = useCallback(async (force = false) => {
    const requestId = ++requestIdRef.current;

    setError(null);

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
            CACHE = res ?? [];
            CACHE_TIME = Date.now();
            return CACHE;
          })
          .finally(() => {
            INFLIGHT = null;
          });
      }

      const result = await INFLIGHT;

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return result;
      }

      setData(result);
      return result;
    } catch (e) {
      if (!mountedRef.current) return [];

      setError(e instanceof Error ? e.message : "Failed to load furniture");
      setData([]);
      return [];
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [isFresh]);

  /* ========================================================= */

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    if (CACHE?.length) {
      setData(CACHE);
      setLoading(false);
      return;
    }

    fetchAll(true);
  }, [fetchAll]);

  /* =========================================================
     CREATE
  ========================================================= */

  const create = useCallback(async (payload: FurnitureFormPayload, userId: string) => {
    const requestId = ++requestIdRef.current;
    setMutating(true);
    setError(null);

    try {
      const created = await createFurniture(payload, userId);

      if (!mountedRef.current || requestId !== requestIdRef.current) return false;

      CACHE = [created, ...(CACHE ?? [])];
      setData(CACHE);

      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create furniture");
      return false;
    } finally {
      setMutating(false);
    }
  }, []);

  /* =========================================================
     UPDATE
  ========================================================= */

  const update = useCallback(async (id: string, payload: FurnitureFormPayload) => {
    const requestId = ++requestIdRef.current;
    setMutating(true);
    setError(null);

    try {
      const updated = await updateFurniture(id, payload);

      if (!mountedRef.current || requestId !== requestIdRef.current) return false;

      CACHE = (CACHE ?? []).map((i) =>
        i.id === id ? updated : i
      );

      setData(CACHE);

      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update furniture");
      return false;
    } finally {
      setMutating(false);
    }
  }, []);

  /* =========================================================
     DELETE
  ========================================================= */

  const remove = useCallback(async (id: string) => {
    const requestId = ++requestIdRef.current;
    setMutating(true);
    setError(null);

    try {
      await deleteFurniture(id);

      if (!mountedRef.current || requestId !== requestIdRef.current) return false;

      CACHE = (CACHE ?? []).filter((i) => i.id !== id);
      setData(CACHE);

      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete furniture");
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
};