export type SenderType = "customer" | "admin" | "system";

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: SenderType;
  message: string | null;
  image_url: string | null;
  is_system: boolean;
  created_at: string;

  sender?: {
    id: string;
    name: string;
    role: string;
  };
};