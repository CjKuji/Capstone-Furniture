import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { InquiryFlowService } from '@/services/inquiry/inquiryFlowService';
import { FetchInquiriesOptions } from '../types/inquiry';

export interface UseInquiryQueryProps {
  supabaseClient: SupabaseClient;
  options?: FetchInquiriesOptions;
}

export function useInquiryQuery({ supabaseClient, options = {} }: UseInquiryQueryProps) {
  const queryClient = useQueryClient();
  const service = new InquiryFlowService(supabaseClient);

  // Unique key representing this specific data fetch configuration
  const queryKey = ['inquiries', options];

  // 1. READ: Fetch inquiries with TanStack Query
  const inquiriesQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await service.getInquiries(options);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes fresh data baseline
  });

  // 2. LIVE UPDATES: Listen to database events via Supabase Realtime channel
  useEffect(() => {
    const channel = supabaseClient
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, and DELETE
          schema: 'public',
          table: 'inquiries',
        },
        () => {
          // Invalidate cache immediately on any DB change to trigger clean refetches background-style
          queryClient.invalidateQueries({ queryKey: ['inquiries'] });
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [supabaseClient, queryClient]);

  // 3. MUTATIONS: State transitions wrapping your service layer
  const acceptForReviewMutation = useMutation({
    mutationFn: ({ inquiryId, adminId }: { inquiryId: string; adminId: string }) =>
      service.acceptForReview(inquiryId, adminId),
    onSuccess: (res) => {
      if (res.success) queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });

  const markQuoteAsReadyMutation = useMutation({
    mutationFn: (inquiryId: string) => service.markQuoteAsReady(inquiryId),
    onSuccess: (res) => {
      if (res.success) queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });

  const presentPaymentIntentMutation = useMutation({
    mutationFn: (inquiryId: string) => service.presentPaymentIntent(inquiryId),
    onSuccess: (res) => {
      if (res.success) queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });

  const submitForVerificationMutation = useMutation({
    mutationFn: (inquiryId: string) => service.submitForVerification(inquiryId),
    onSuccess: (res) => {
      if (res.success) queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });

  const approvePaymentToProductionMutation = useMutation({
    mutationFn: (inquiryId: string) => service.approvePaymentToProduction(inquiryId),
    onSuccess: (res) => {
      if (res.success) queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });

  const markProductionCompleteMutation = useMutation({
    mutationFn: ({ inquiryId, deliveryMethod }: { inquiryId: string; deliveryMethod: 'pickup' | 'delivery' }) =>
      service.markProductionComplete(inquiryId, deliveryMethod),
    onSuccess: (res) => {
      if (res.success) queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });

  const dispatchShipmentMutation = useMutation({
    mutationFn: (inquiryId: string) => service.dispatchShipment(inquiryId),
    onSuccess: (res) => {
      if (res.success) queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });

  const completeInquiryMutation = useMutation({
    mutationFn: (inquiryId: string) => service.completeInquiry(inquiryId),
    onSuccess: (res) => {
      if (res.success) queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });

  const cancelInquiryMutation = useMutation({
    mutationFn: ({ inquiryId, reason }: { inquiryId: string; reason: string }) =>
      service.cancelInquiry(inquiryId, reason),
    onSuccess: (res) => {
      if (res.success) queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });

  return {
    // Queries data & state
    inquiries: inquiriesQuery.data ?? [],
    isLoading: inquiriesQuery.isLoading,
    isError: inquiriesQuery.isError,
    error: inquiriesQuery.error,
    refetch: inquiriesQuery.refetch,

    // Mutation triggers exposed to UI
    actions: {
      acceptForReview: acceptForReviewMutation.mutateAsync,
      markQuoteAsReady: markQuoteAsReadyMutation.mutateAsync,
      presentPaymentIntent: presentPaymentIntentMutation.mutateAsync,
      submitForVerification: submitForVerificationMutation.mutateAsync,
      approvePaymentToProduction: approvePaymentToProductionMutation.mutateAsync,
      markProductionComplete: markProductionCompleteMutation.mutateAsync,
      dispatchShipment: dispatchShipmentMutation.mutateAsync,
      completeInquiry: completeInquiryMutation.mutateAsync,
      cancelInquiry: cancelInquiryMutation.mutateAsync,
    },
    
    // Status states for loading indicators per button action
    mutatingStates: {
      isAccepting: acceptForReviewMutation.isPending,
      isQuoting: markQuoteAsReadyMutation.isPending,
      isCancelling: cancelInquiryMutation.isPending,
    }
  };
}