import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { inquiryChargeService } from "@/services/inquiry/inquiryCharges"; // Adjust this path to your service file

// Define query key factory for predictability
export const inquiryChargesKeys = {
  all: ["inquiryCharges"] as const,
  lists: () => [...inquiryChargesKeys.all, "list"] as const,
  list: (inquiryId: string) => [...inquiryChargesKeys.lists(), inquiryId] as const,
};

interface UseUserInquiryChargesOptions {
  supabase: SupabaseClient;
  inquiryId: string;
  userId?: string; // Optional parameter to enforce tenant-isolation/ownership check
  enabled?: boolean;
}

export function useUserInquiryCharges({
  supabase,
  inquiryId,
  userId,
  enabled = true,
}: UseUserInquiryChargesOptions) {
  const queryClient = useQueryClient();
  const queryKey = inquiryChargesKeys.list(inquiryId);

  // 1. Fetching Data with useQuery
  const {
    data: charges = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => inquiryChargeService.getChargesByInquiry(supabase, inquiryId, userId),
    enabled: !!inquiryId && enabled,
  });

  // 2. Realtime Subscription for Live Updates
  useEffect(() => {
    if (!inquiryId || !enabled) return;

    // Listen to changes on the inquiry_charges table for this specific inquiry
    const channel = supabase
      .channel(`inquiry-charges-${inquiryId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, and DELETE
          schema: "public",
          table: "inquiry_charges",
          filter: `inquiry_id=eq.${inquiryId}`, // Fixed syntax alignment for realtime filters
        },
        () => {
          // Invalidate and refetch data to guarantee data consistency
          // (including joining user profiles on the server-side)
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, inquiryId, enabled, queryClient, queryKey]);

  // 3. Mutation: Finalize Charges (Accept / Reject)
  const finalizeChargesMutation = useMutation({
    mutationFn: ({ status }: { status: "accepted" | "rejected" }) =>
      inquiryChargeService.finalizeInquiryCharges(supabase, inquiryId, status),
    onSuccess: () => {
      // Invalidate the local charges list
      queryClient.invalidateQueries({ queryKey });
      
      // Invalidate parent 'inquiries' cache since status/totals changed.
      queryClient.invalidateQueries({ queryKey: ["inquiries", inquiryId] });
    },
  });

  // Convenience wrapper functions for the UI component
  const acceptCharges = () => finalizeChargesMutation.mutateAsync({ status: "accepted" });
  const rejectCharges = () => finalizeChargesMutation.mutateAsync({ status: "rejected" });

  return {
    charges,
    isLoading,
    error,
    acceptCharges,
    rejectCharges,
    isFinalizing: finalizeChargesMutation.isPending,
    finalizeError: finalizeChargesMutation.error,
  };
}