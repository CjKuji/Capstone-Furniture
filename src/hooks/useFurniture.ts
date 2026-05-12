"use client";

import { useQuery } from "@tanstack/react-query";

import { getFurniturePublic } from "@/services/furniturePublic";
import { furniturePublicKeys } from "./queryKeys";

import type { FurniturePublicListItem } from "@/types/furniture-public";

/**
 * =========================================================
 * HOOK - PUBLIC FURNITURE LIST
 * =========================================================
 */
export function useFurniturePublicList() {
  return useQuery<FurniturePublicListItem[]>({
    queryKey: furniturePublicKeys.list(),

    queryFn: async () => {
      const data = await getFurniturePublic();

      // ✅ Safe fallback (NO unsafe casting)
      return (data ?? []) as FurniturePublicListItem[];
    },

    /**
     * CACHE SETTINGS
     */
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,

    /**
     * REFETCH BEHAVIOR
     */
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,

    retry: 2,
  });
}