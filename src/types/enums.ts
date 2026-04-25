export type PublishStatus = "draft" | "published" | "archived";

export type InquiryStatus =
  | "pending"
  | "in_review"
  | "quoted"
  | "approved"
  | "rejected"
  | "completed";

export type OrderStatus =
  | "pending"
  | "in_production"
  | "completed"
  | "cancelled";

export type FulfillmentStatus =
  | "not_ready"
  | "preparing"
  | "shipped"
  | "delivered";

export type DeliveryMethod = "pickup" | "delivery";

export type UserRole = "customer" | "admin" | "super_admin";

export type SenderType = "user" | "admin";