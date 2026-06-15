"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { adminInquiryService } from "@/services/inquiry/adminService";
import { CustomInquiryStatus, FetchInquiriesOptions } from "@/types/inquiry";

// =========================================================================
// STRICT TYPE DEFINITIONS (MATCHES USER SIDE PARITY)
// =========================================================================
export interface AdminUserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export interface AdminInquiryConversation {
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
}

export interface AdminInquiryImage {
  id: string;
  inquiry_item_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface AdminInquiryItem {
  id: string;
  inquiry_id: string;
  title: string | null;
  description: string;
  quantity: number;
  created_at: string;
  updated_at?: string;
  inquiry_images: AdminInquiryImage[];
}

export interface AdminInquiryCharge {
  id: string;
  inquiry_id: string;
  type: string;
  label: string | null;
  amount: number;
  is_additive: boolean;
  created_by: string | null;
  created_at: string;
}

export interface AdminInquiryComposite {
  id: string;
  user_id: string;
  created_at: string;
  delivery_address: string | null;
  delivery_method: "pickup" | "delivery" | null;
  phone_number: string | null;
  pickup_location: string | null;
  status: CustomInquiryStatus;
  profiles: AdminUserProfile | null; // Admin-specific metadata tracker
  inquiry_items: AdminInquiryItem[];
  inquiry_charges: AdminInquiryCharge[];
  conversations: AdminInquiryConversation[]; // Matched user-side collection name structure
}

// =========================================================================
// 1. ALL INQUIRIES FEED HOOK
// =========================================================================
export function useAdminInquiries(options?: FetchInquiriesOptions): UseQueryResult<AdminInquiryComposite[], Error> {
  const queryClient = useQueryClient();
  const status = options?.status;
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  const queryKey = useMemo(() => ["admin", "inquiries", { status, limit, offset }], [status, limit, offset]);

  const queryResult = useQuery<AdminInquiryComposite[], Error>({
    queryKey,
    queryFn: async () => {
      const rawData = await adminInquiryService.fetchAdminInquiries({ status, limit, offset });
      
      return (rawData ?? []).map((inquiry: any) => {
        const profileData = Array.isArray(inquiry.profiles) 
          ? inquiry.profiles[0] || null 
          : inquiry.profiles || null;

        // Wrap target single relationship safely inside a list mapping structure matching user parameters
        const conversationData = Array.isArray(inquiry.conversation) 
          ? inquiry.conversation 
          : inquiry.conversation ? [inquiry.conversation] : [];

        return {
          id: inquiry.id,
          user_id: inquiry.user_id,
          created_at: inquiry.created_at ?? new Date().toISOString(),
          delivery_address: inquiry.delivery_address ?? null,
          delivery_method: inquiry.delivery_method ?? null,
          phone_number: inquiry.phone_number ?? null,
          pickup_location: inquiry.pickup_location ?? null,
          status: inquiry.status ?? "requested",
          profiles: profileData,
          inquiry_items: (inquiry.inquiry_items ?? []).map((item: any) => ({
            ...item,
            inquiry_images: item.inquiry_images ?? []
          })),
          inquiry_charges: inquiry.inquiry_charges ?? [],
          conversations: conversationData
        };
      }) as AdminInquiryComposite[];
    },
    staleTime: 1000 * 30,
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    const inquiriesChannel = supabase
      .channel("admin-inquiries-global-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inquiries" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "inquiries"] });
        }
      )
      .subscribe();

    const chatChannel = supabase
      .channel("admin-conversations-global-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "inquiries"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inquiriesChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [queryClient]);

  return queryResult;
}

// =========================================================================
// 2. SINGLE INQUIRY DETAIL HOOK
// =========================================================================
export function useAdminInquiryDetails(inquiryId: string): UseQueryResult<AdminInquiryComposite, Error> {
  const queryClient = useQueryClient();
  const detailKey = useMemo(() => ["admin", "inquiries", "detail", inquiryId], [inquiryId]);

  const queryResult = useQuery<AdminInquiryComposite, Error>({
    queryKey: detailKey,
    queryFn: async () => {
      if (!inquiryId) throw new Error("Unique parameter ID token missing from state router context.");
      const data = await adminInquiryService.fetchInquiryById(inquiryId);
      if (!data) throw new Error("Target record not found.");

      const rawInquiry = data as any;
      const profileData = Array.isArray(rawInquiry.profiles) ? rawInquiry.profiles[0] || null : rawInquiry.profiles || null;
      const conversationData = Array.isArray(rawInquiry.conversation) 
        ? rawInquiry.conversation 
        : rawInquiry.conversation ? [rawInquiry.conversation] : [];

      return {
        id: rawInquiry.id,
        user_id: rawInquiry.user_id,
        created_at: rawInquiry.created_at ?? new Date().toISOString(),
        delivery_address: rawInquiry.delivery_address ?? null,
        delivery_method: rawInquiry.delivery_method ?? null,
        phone_number: rawInquiry.phone_number ?? null,
        pickup_location: rawInquiry.pickup_location ?? null,
        status: rawInquiry.status ?? "requested",
        profiles: profileData,
        inquiry_items: (rawInquiry.inquiry_items ?? []).map((item: any) => ({
          ...item,
          inquiry_images: item.inquiry_images ?? []
        })),
        inquiry_charges: rawInquiry.inquiry_charges ?? [],
        conversations: conversationData
      } as AdminInquiryComposite;
    },
    enabled: Boolean(inquiryId),
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (!inquiryId) return;

    const inquirySub = supabase
      .channel(`admin-inquiry-detail-sync-${inquiryId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inquiries", filter: `id=eq.${inquiryId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: detailKey });
        }
      )
      .subscribe();

    const chatSub = supabase
      .channel(`admin-inquiry-chat-sync-${inquiryId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `inquiry_id=eq.${inquiryId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: detailKey });
          queryClient.invalidateQueries({ queryKey: ["admin", "inquiries"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inquirySub);
      supabase.removeChannel(chatSub);
    };
  }, [inquiryId, queryClient, detailKey]);

  return queryResult;
}

// =========================================================================
// 3. TRANSACTION MUTATIONS
// =========================================================================
export function useUpdateInquiryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inquiryId, status }: { inquiryId: string; status: CustomInquiryStatus }) => {
      return await adminInquiryService.updateInquiryStatus(inquiryId, status);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inquiries", "detail", variables.inquiryId] });
    },
  });
}