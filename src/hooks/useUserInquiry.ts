"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient, useMutation, UseQueryOptions } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { inquiryService, CreateInquiryPayload, CustomInquiryStatus } from "@/services/inquiry/inquiryService";

// =========================================================================
// STRICT TYPE DEFINITIONS
// =========================================================================
export type InquiryConversation = {
  id: string;
  user_id: string;
  admin_id: string | null;
  customer_unread_count: number;
  admin_unread_count: number;
  order_id: string | null;
  inquiry_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InquiryImage = {
  id: string;
  inquiry_item_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
};

export type InquiryCharge = {
  id: string;
  inquiry_id: string;
  type: string;
  label: string | null;
  amount: number;
  is_additive: boolean;
  created_by: string | null;
  created_at: string;
};

export type InquiryItem = {
  id: string;
  inquiry_id: string;
  title: string | null;
  description: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  inquiry_images: InquiryImage[]; 
};

export type InquiryData = {
  id: string;
  user_id: string;
  created_at: string; 
  delivery_address: string | null;
  delivery_method: "pickup" | "delivery" | null;
  phone_number: string | null;
  pickup_location: string | null;
  status: CustomInquiryStatus;
  charge_status: string;
  inquiry_reference_code: string | null;
  inquiry_items: InquiryItem[];
  inquiry_charges: InquiryCharge[];
  conversations: InquiryConversation[]; 
};

// =========================================================================
// UNIFIED QUERY CACHE KEYS
// =========================================================================
export const inquiryKeys = {
  all: ["inquiries"] as const,
  lists: () => [...inquiryKeys.all, "list"] as const,
  detail: (id: string) => [...inquiryKeys.all, "detail", id] as const,
};

/**
 * 1. FETCH USER INQUIRIES HOOK (FIXED SUBSCRIPTION & DATA MAPPING FLOW)
 */
export const useUserInquiries = (
  options?: Partial<UseQueryOptions<InquiryData[], Error>>
) => {
  const queryClient = useQueryClient();

  const queryResult = useQuery<InquiryData[], Error>({
    queryKey: inquiryKeys.lists(),
    queryFn: async () => {
      const rawData = await inquiryService.fetchUserInquiries();
      
      return (rawData ?? []).map((inquiry: any) => {
        // PARITY FIX: Fallback layout checks matching your clean admin mapper
        let conversationData: any[] = [];
        if (inquiry.conversations) {
          conversationData = Array.isArray(inquiry.conversations) ? inquiry.conversations : [inquiry.conversations];
        } else if (inquiry.conversation) {
          conversationData = Array.isArray(inquiry.conversation) ? inquiry.conversation : [inquiry.conversation];
        }

        return {
          ...inquiry,
          created_at: inquiry.created_at ?? new Date().toISOString(),
          status: inquiry.status ?? "requested", 
          charge_status: inquiry.charge_status ?? "none",
          inquiry_items: (inquiry.inquiry_items ?? []).map((item: any) => ({
            ...item,
            inquiry_images: item.inquiry_images ?? []
          })),
          inquiry_charges: inquiry.inquiry_charges ?? [],
          conversations: conversationData.map((c: any) => ({
            ...c,
            customer_unread_count: Number(c.customer_unread_count ?? 0),
            admin_unread_count: Number(c.admin_unread_count ?? 0)
          })),
        };
      }) as InquiryData[];
    },
    staleTime: 2 * 60 * 1000,
    ...options,
  });

  useEffect(() => {
    let inquiriesChannel: any = null;
    let conversationsChannel: any = null;
    let isMounted = true;

    supabase.auth.getSession().then(({ data: sessionData }) => {
      const currentUserId = sessionData?.session?.user?.id;
      
      if (!currentUserId || !isMounted) return;

      const inquiriesTopic = `user-inquiries-row-sync-${currentUserId}`;
      const conversationsTopic = `user-conversations-live-sync-${currentUserId}`;

      // Clear any outdated channels cleanly before allocating fresh hooks
      const oldInquiries = supabase.getChannels().find(
        c => c.topic === `realtime:${inquiriesTopic}` || c.topic === inquiriesTopic
      );
      if (oldInquiries) supabase.removeChannel(oldInquiries);

      const oldConversations = supabase.getChannels().find(
        c => c.topic === `realtime:${conversationsTopic}` || c.topic === conversationsTopic
      );
      if (oldConversations) supabase.removeChannel(oldConversations);

      // Realtime Inquiries Sync pipeline
      inquiriesChannel = supabase
        .channel(inquiriesTopic)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "inquiries",
            filter: `user_id=eq.${currentUserId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: inquiryKeys.lists() });
          }
        )
        .subscribe();

      // Realtime Conversations Sync pipeline (PARITY FIX: Dropped rigid inline filters)
      conversationsChannel = supabase
        .channel(conversationsTopic)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversations",
          },
          (payload: any) => {
            // Verify if the modified row record relates to the authenticated customer session context
            const newRow = payload.new;
            const oldRow = payload.old;
            const belongsToUser = (newRow?.user_id === currentUserId) || (oldRow?.user_id === currentUserId);
            
            if (belongsToUser) {
              queryClient.invalidateQueries({ queryKey: inquiryKeys.lists() });
            }
          }
        )
        .subscribe();
    });

    return () => {
      isMounted = false;
      if (inquiriesChannel) supabase.removeChannel(inquiriesChannel);
      if (conversationsChannel) supabase.removeChannel(conversationsChannel);
    };
  }, [queryClient]);

  const mutate = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: inquiryKeys.lists() });
  }, [queryClient]);

  return {
    ...queryResult,
    mutate,
  };
};

/**
 * 2. FETCH SINGLE INQUIRY DETAIL HOOK
 */
export const useInquiryDetail = (inquiryId: string) => {
  return useQuery({
    queryKey: inquiryKeys.detail(inquiryId),
    queryFn: () => inquiryService.fetchInquiryById(inquiryId),
    enabled: !!inquiryId,
  });
};

/**
 * 3. CREATE INQUIRY MUTATION HOOK
 */
export const useCreateInquiry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInquiryPayload) => inquiryService.createInquiry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inquiryKeys.lists() });
    },
    onError: (error: any) => {
      console.error("Inquiry submission execution failed:", error?.message || error);
    },
  });
};