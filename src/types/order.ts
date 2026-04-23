import type {
  OrderStatus,
  DeliveryMethod,
  FulfillmentStatus,
} from "./enums";

export type Order = {
  id: string;

  user_id: string;
  configuration_id: string;

  total_price: number | null;

  status: OrderStatus;
  delivery_method: DeliveryMethod | null;
  fulfillment_status: FulfillmentStatus;

  created_at: string;
};

export type OrderAdmin = Order & {
  user?: import("@/types/user").Profile;
};

