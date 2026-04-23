import { supabase } from "@/lib/supabase";
import type { Inquiry, Conversation, Message } from "@/types/inquiry";

/* =========================
   INQUIRIES
========================= */

export async function getInquiries(): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getInquiryById(id: string) {
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

/* =========================
   CONVERSATIONS
========================= */

export async function getConversation(inquiryId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("inquiry_id", inquiryId)
    .single();

  if (error) throw error;
  return data;
}

/* =========================
   MESSAGES
========================= */

export async function getMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}