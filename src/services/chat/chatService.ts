// services/chat/chatService.ts

import { supabase } from "@/lib/supabase";

/**
 * =========================================================
 * TYPES
 * =========================================================
 */
export type SenderType = "customer" | "admin" | "system";

export type MessageMetadata = {
  type?: string;
  scope?: string;
} | null;

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string | null;
  image_url: string | null;
  sender_type: SenderType;
  created_at: string;
  is_system: boolean;
  metadata?: MessageMetadata;
  sender?: {
    id: string;
    name: string;
    role: string;
  };
};

/**
 * =========================================================
 * METADATA SAFETY
 * =========================================================
 */
function isMessageMetadata(
  value: unknown
): value is { type?: string; scope?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  return (
    ("type" in obj
      ? typeof obj.type === "string" || obj.type === undefined
      : true) &&
    ("scope" in obj
      ? typeof obj.scope === "string" || obj.scope === undefined
      : true)
  );
}

function normalizeMetadata(value: unknown): MessageMetadata {
  if (isMessageMetadata(value)) return value;
  return null;
}

/**
 * =========================================================
 * SHAPE RAW ROW → Message
 * =========================================================
 */
function shapeMessage(msg: any): Message {
  const base: Message = {
    id: msg.id,
    conversation_id: msg.conversation_id,
    sender_id: msg.sender_id,
    sender_type: msg.sender_type ?? "customer",
    is_system: msg.is_system ?? false,
    created_at: msg.created_at ?? new Date().toISOString(),
    message: msg.message ?? null,
    image_url: msg.image_url ?? null,
    metadata: normalizeMetadata(msg.metadata),
  };

  if (base.is_system || base.sender_type === "system") {
    return { ...base, sender: { id: "system", name: "System", role: "system" } };
  }

  const p = msg.profiles as {
    id: string;
    first_name: string | null;
    middle_initial: string | null;
    last_name: string | null;
    role: string | null;
  } | null;

  let dynamicName = "Unknown";
  if (p) {
    const formattedMI = p.middle_initial ? `${p.middle_initial.trim().replace('.', '')}.` : "";
    dynamicName = [p.first_name, formattedMI, p.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || "Unknown";
  }

  return {
    ...base,
    sender: p
      ? { id: p.id, name: dynamicName, role: p.role ?? base.sender_type }
      : { id: base.sender_id, name: "Unknown", role: base.sender_type },
  };
}

/**
 * =========================================================
 * CONVERSATION RESOLVERS (Polymorphic Support)
 * =========================================================
 */

export async function getConversationByOrder(orderId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getConversationByInquiry(inquiryId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("inquiry_id", inquiryId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Unified Upsert Channel Fetcher
 * Lazily spawns a new conversation bridge row if a participant interacts with the chat frame
 */
export async function getOrCreateConversation({
  userId,
  adminId,
  orderId = null,
  inquiryId = null,
}: {
  userId: string;
  adminId: string;
  orderId?: string | null;
  inquiryId?: string | null;
}) {
  if (!orderId && !inquiryId) {
    throw new Error("Cannot orchestrate a message pipeline without an Order or Inquiry reference constraint.");
  }

  let query = supabase.from("conversations").select("*");
  if (orderId) {
    query = query.eq("order_id", orderId);
  } else if (inquiryId) {
    query = query.eq("inquiry_id", inquiryId);
  }

  const { data: existing, error: fetchError } = await query.maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (existing) return existing;

  // ⭐ FIX: Explicitly type and struct the payload so it completely satisfies Supabase's RejectExcessProperties checker
  const { data: created, error: insertError } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      admin_id: adminId,
      customer_unread_count: 0,
      admin_unread_count: 0,
      order_id: orderId || null,
      inquiry_id: inquiryId || null
    })
    .select("*")
    .single();

  if (insertError) throw new Error(insertError.message);
  return created;
}

/**
 * =========================================================
 * MARK AS READ
 * =========================================================
 */
export async function markConversationAsRead({
  conversationId,
  readerType,
}: {
  conversationId: string;
  readerType: "customer" | "admin";
}) {
  const rpcMethod = 
    readerType === "customer" 
      ? "mark_customer_conversation_read" 
      : "mark_admin_conversation_read";

  // Calls the postgres stored procedure passing the unified parameter mapping identity 
  const { error } = await supabase.rpc(rpcMethod, {
    conv_id: conversationId,
  });

  if (error) throw new Error(error.message);
}

/**
 * =========================================================
 * GET MESSAGES
 * =========================================================
 */
export async function getMessages(
  conversationId: string,
  limit = 30,
  offset = 0
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      profiles (
        id,
        first_name,
        middle_initial,
        last_name,
        role
      )
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  return (data ?? []).slice().reverse().map(shapeMessage);
}

/**
 * =========================================================
 * GET MESSAGES PAGINATED (used by useInfiniteQuery)
 * =========================================================
 */
export async function getMessagesPaginated({
  conversationId,
  before,
  limit = 30,
}: {
  conversationId: string;
  before?: string;
  limit?: number;
}): Promise<Message[]> {
  let query = supabase
    .from("messages")
    .select(`
      *,
      profiles (
        id,
        first_name,
        middle_initial,
        last_name,
        role
      )
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).slice().reverse().map(shapeMessage);
}

/**
 * =========================================================
 * SEND MESSAGE
 * =========================================================
 */
export async function sendMessage({
  conversationId,
  senderId,
  message,
  imageUrl = null,
  senderType = "customer",
  isSystem = false,
  metadata = null,
}: {
  conversationId: string;
  senderId: string;
  message?: string;
  imageUrl?: string | null;
  senderType?: SenderType;
  isSystem?: boolean;
  metadata?: MessageMetadata;
}): Promise<Message> {
  if (!conversationId) throw new Error("Missing conversationId");
  if (!senderId) throw new Error("Missing senderId");
  if (!message?.trim() && !imageUrl) throw new Error("Cannot send empty message");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      message: message?.trim() || null,
      image_url: imageUrl,
      sender_type: senderType,
      is_system: isSystem,
      metadata: normalizeMetadata(metadata),
    })
    .select(`
      *,
      profiles (
        id,
        first_name,
        middle_initial,
        last_name,
        role
      )
    `)
    .single();

  if (error) throw new Error(error.message);

  return shapeMessage(data);
}

/**
 * =========================================================
 * IMAGE UPLOAD
 * =========================================================
 */
export async function uploadChatImage(file: File, conversationId: string) {
  const fileExt = file.name.split(".").pop();
  const filePath = `chat/${conversationId}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("chat-images")
    .upload(filePath, file);

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from("chat-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * =========================================================
 * LAST MESSAGE
 * =========================================================
 */
export async function getLastMessage(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}