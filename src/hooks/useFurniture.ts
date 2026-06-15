import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getFurniturePublic } from "@/services/furniturePublic";
import type { FurniturePublicListItem } from "@/types/furniture-public";

// Unique query key for caching this list
export const FURNITURE_LIST_QUERY_KEY = ["furniturePublicList"];

export function useFurniturePublicList() {
  const queryClient = useQueryClient();

  // 1. Core query fetching full initial list data with relational transformations
  const query = useQuery<FurniturePublicListItem[]>({
    queryKey: FURNITURE_LIST_QUERY_KEY,
    queryFn: getFurniturePublic,
    staleTime: 1000 * 60 * 5, // Keep cache fresh for 5 minutes
  });

  // 2. Set up real-time listener to keep the cached list synced perfectly
  useEffect(() => {
    const channel = supabase
      .channel("furniture-public-list-mutations")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for INSERT, UPDATE, and DELETE changes
          schema: "public",
          table: "furniture",
        },
        async (payload) => {
          // Approach A: Simplest & most reliable strategy for relational joins.
          // Because the realtime payload only provides the raw furniture row (missing category object, images array, etc.),
          // invalidating forces React Query to cleanly re-fetch the accurate transformed list from getFurniturePublic.
          await queryClient.invalidateQueries({ queryKey: FURNITURE_LIST_QUERY_KEY });

          /* // Approach B: Alternative local cache manipulation (Optimistic-style execution)
          // Use this alternative instead if you prefer preventing background network requests on mutations:
          
          if (payload.eventType === 'DELETE' || payload.new.deleted_at !== null || payload.new.publish_status !== 'published') {
            queryClient.setQueryData<FurniturePublicListItem[]>(FURNITURE_LIST_QUERY_KEY, (old) => 
              old ? old.filter(item => item.id !== payload.old.id) : []
            );
          } else {
            // Because joins (images, variants) aren't present in payload.new, 
            // a single invalidate target remains the safest data integrity choice.
            await queryClient.invalidateQueries({ queryKey: FURNITURE_LIST_QUERY_KEY });
          }
          */
        }
      )
      .subscribe();

    // Clean up channel subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}