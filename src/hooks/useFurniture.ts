import { useQuery } from "@tanstack/react-query";

import { getFurniturePublic } from "@/services/furniturePublic";
import { furniturePublicKeys } from "./queryKeys";

export function useFurniturePublicList() {
  return useQuery({
    queryKey: furniturePublicKeys.list(),
    queryFn: getFurniturePublic,

    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,

    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}