import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import { inquiryChargeService, CreateInquiryChargeInput, UpdateInquiryChargeInput } from "@/services/inquiry/inquiryCharges";

interface UseAdminInquiryChargesProps {
  supabase: SupabaseClient;
  inquiryId: string;
}

export function useAdminInquiryCharges({ supabase, inquiryId }: UseAdminInquiryChargesProps) {
  const queryClient = useQueryClient();
  const queryKey = ["inquiry_charges", inquiryId];

  const { data: charges, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => inquiryChargeService.getChargesByInquiry(supabase, inquiryId),
    enabled: !!inquiryId && !!supabase,
  });

  const createChargeMutation = useMutation({
    mutationFn: (input: Omit<CreateInquiryChargeInput, "inquiryId">) =>
      inquiryChargeService.createCharge(supabase, { 
        ...input, 
        inquiryId
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["admin_inquiries"] });
    },
  });

  const updateChargeMutation = useMutation({
    // Correctly forwards supabase and inquiryId to match service argument blueprint
    mutationFn: (input: UpdateInquiryChargeInput) => 
      inquiryChargeService.updateCharge(supabase, inquiryId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["admin_inquiries"] });
    },
  });

  const deleteChargeMutation = useMutation({
    // Correctly forwards supabase, inquiryId, and chargeId to service definition
    mutationFn: (chargeId: string) => 
      inquiryChargeService.deleteCharge(supabase, inquiryId, chargeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["admin_inquiries"] });
    },
  });

  return {
    charges,
    isLoading,
    error,
    createCharge: createChargeMutation.mutateAsync,
    isCreating: createChargeMutation.isPending,
    updateCharge: updateChargeMutation.mutateAsync,
    isUpdating: updateChargeMutation.isPending,
    deleteCharge: deleteChargeMutation.mutateAsync,
    isDeleting: deleteChargeMutation.isPending,
  };
}