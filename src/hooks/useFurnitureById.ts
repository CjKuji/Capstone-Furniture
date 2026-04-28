import { useQuery } from "@tanstack/react-query";

import { getFurniturePublicById } from "@/services/furniturePublic";
import { furniturePublicKeys } from "./queryKeys";

export function useFurniturePublicById(id?: string) {
  return useQuery({
    queryKey: furniturePublicKeys.detail(id ?? ""),

    queryFn: () => {
      if (!id) throw new Error("Furniture ID is required");
      return getFurniturePublicById(id);
    },

    enabled: !!id,

    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,

    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}