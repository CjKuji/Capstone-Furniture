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
 * METADATA SAFETY (FIX FOR YOUR ERROR)
 * =========================================================
 */
function isMessageMetadata(value: unknown): value is { type?: string; scope?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const obj = value as Record<string, unknown>;

  return (
    ("type" in obj ? typeof obj.type === "string" || obj.type === undefined : true) &&
    ("scope" in obj ? typeof obj.scope === "string" || obj.scope === undefined : true)
  );
}

function normalizeMetadata(value: unknown): MessageMetadata {
  if (isMessageMetadata(value)) return value;
  return null;
}

/**
 * =========================================================
 * DEBUG
 * =========================================================
 */
const DEBUG_CHAT = true;

function debug(...args: any[]) {
  if (DEBUG_CHAT) console.log("[CHAT SERVICE]", ...args);
}

/**
 * =========================================================
 * USER RESOLVER
 * =========================================================
 */
async function resolveSender(senderId: string) {
  if (!senderId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", senderId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.full_name ?? "Unknown",
    role: data.role ?? "customer",
  };
}

/**
 * =========================================================
 * CONVERSATION
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
  const payload =
    readerType === "customer"
      ? {
          customer_unread_count: 0,
          customer_last_read_at: new Date().toISOString(),
        }
      : {
          admin_unread_count: 0,
          admin_last_read_at: new Date().toISOString(),
        };

  const { error } = await supabase
    .from("conversations")
    .update(payload)
    .eq("id", conversationId);

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
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  const messages = (data ?? []).slice().reverse();

  return Promise.all(
    messages.map(async (msg) => {
      const normalized: Message = {
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

      if (normalized.sender_type === "system" || normalized.is_system) {
        return {
          ...normalized,
          sender: {
            id: "system",
            name: "System",
            role: "system",
          },
        };
      }

      const sender = await resolveSender(normalized.sender_id);

      return {
        ...normalized,
        sender: sender ?? {
          id: normalized.sender_id,
          name: "Unknown",
          role: normalized.sender_type,
        },
      };
    })
  );
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
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    conversation_id: data.conversation_id,
    sender_id: data.sender_id,

    sender_type: data.sender_type ?? "customer",
    is_system: data.is_system ?? false,

    created_at: data.created_at ?? new Date().toISOString(),

    message: data.message ?? null,
    image_url: data.image_url ?? null,

    metadata: normalizeMetadata(data.metadata),
  };
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