import type { InquiryStatus, SenderType } from "./enums";

export type Inquiry = {
  id: string;

  user_id: string | null;

  title: string | null;
  description: string | null;

  reference_image_url: string | null;

  status: InquiryStatus;

  created_at: string;
};

export type Conversation = {
  id: string;

  inquiry_id: string | null;

  user_id: string | null;
  admin_id: string | null;

  created_at: string;
};

export type Message = {
  id: string;

  conversation_id: string;

  sender_id: string | null;

  sender_type: SenderType;

  message: string | null;

  image_url: string | null;

  created_at: string;
};

export type InquiryThread = Inquiry & {
  conversation?: Conversation;
  messages?: Message[];
};