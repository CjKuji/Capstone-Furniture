"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
   QUERY KEY
========================================================= */

const FURNITURE_KEY = ["furniture"] as const;

/* =========================================================
   HOOK
========================================================= */

export function useFurniture() {
  const queryClient = useQueryClient();

  /* =========================================================
     FETCH (READ)
  ========================================================= */

  const {
    data = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<FurnitureItemAdmin[]>({
    queryKey: FURNITURE_KEY,
    queryFn: async () => {
      const res = await getFurniture();
      return res ?? [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes cache (replaces your TTL)
    refetchOnWindowFocus: true,
  });

  /* =========================================================
     CREATE
  ========================================================= */

  const createMutation = useMutation({
    mutationFn: async ({
      payload,
      userId,
    }: {
      payload: FurnitureFormPayload;
      userId: string;
    }) => createFurniture(payload, userId),

    onSuccess: (newItem) => {
      queryClient.setQueryData<FurnitureItemAdmin[]>(
        FURNITURE_KEY,
        (old = []) => [newItem, ...old]
      );
    },
  });

  /* =========================================================
     UPDATE
  ========================================================= */

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: FurnitureFormPayload;
    }) => updateFurniture(id, payload),

    onSuccess: (updated) => {
      queryClient.setQueryData<FurnitureItemAdmin[]>(
        FURNITURE_KEY,
        (old = []) =>
          old.map((item) =>
            item.id === updated.id ? updated : item
          )
      );
    },
  });

  /* =========================================================
     DELETE
  ========================================================= */

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteFurniture(id),

    onSuccess: (_, id) => {
      queryClient.setQueryData<FurnitureItemAdmin[]>(
        FURNITURE_KEY,
        (old = []) => old.filter((item) => item.id !== id)
      );
    },
  });

  /* =========================================================
     RETURN API (CLEAN)
  ========================================================= */

  return {
    /* data */
    data,
    loading: isLoading,
    fetching: isFetching,
    error: error ? (error as Error).message : null,

    /* actions */
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,

    /* manual refresh */
    refetch: () =>
      queryClient.invalidateQueries({ queryKey: FURNITURE_KEY }),
  };
}