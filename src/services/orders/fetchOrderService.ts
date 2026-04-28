import { supabase } from "@/lib/supabase";
import type { Order, OrderAdmin } from "@/types/order";

/**
 * =========================================================
 * CUSTOMER: Get all orders
 * =========================================================
 */
export async function getMyOrders(): Promise<Order[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      user_id,
      quote_total_price,

      order_status,
      payment_status,
      delivery_method,

      customer_name,
      phone_number,
      delivery_address,
      delivery_notes,
      admin_notes,

      order_reference_code,
      price_breakdown,

      created_at,
      updated_at,

      order_items (
        id,
        furniture_id,
        selected_variant_id,
        quantity,
        unit_price,
        total_price,
        furniture_snapshot,
        variant_snapshot,
        model_snapshot_url,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch orders");
  }

  return (data ?? []) as Order[];
}

/**
 * =========================================================
 * CUSTOMER: Get single order
 * =========================================================
 */
export async function getMyOrderById(orderId: string): Promise<Order> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      user_id,
      quote_total_price,

      order_status,
      payment_status,
      delivery_method,

      customer_name,
      phone_number,
      delivery_address,
      delivery_notes,
      admin_notes,

      order_reference_code,
      price_breakdown,

      created_at,
      updated_at,

      order_items (
        id,
        furniture_id,
        selected_variant_id,
        quantity,
        unit_price,
        total_price,
        furniture_snapshot,
        variant_snapshot,
        model_snapshot_url,
        created_at
      ),

      order_timelines (
        id,
        title,
        description,
        metadata,
        created_at
      ),

      conversations (
        id
      )
    `)
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    throw new Error(error.message || "Order not found");
  }

  return data as Order;
}

/**
 * =========================================================
 * ADMIN: Get all orders
 * =========================================================
 */
export async function getAdminOrders(): Promise<OrderAdmin[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      user_id,
      quote_total_price,

      order_status,
      payment_status,
      delivery_method,

      customer_name,
      phone_number,
      delivery_address,
      delivery_notes,
      admin_notes,

      order_reference_code,
      price_breakdown,

      created_at,
      updated_at,

      profiles:user_id (
        id,
        full_name,
        created_at,
        role
      ),

      order_items (
        id,
        furniture_id,
        selected_variant_id,
        quantity,
        unit_price,
        total_price,
        furniture_snapshot,
        variant_snapshot,
        model_snapshot_url,
        created_at
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch admin orders");
  }

  return (data ?? []).map((item: any) => ({
    ...item,
    user: item.profiles ?? null,
  })) as OrderAdmin[];
}

/**
 * =========================================================
 * ADMIN: Get single order
 * =========================================================
 */
export async function getAdminOrderById(
  orderId: string
): Promise<OrderAdmin> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      user_id,
      quote_total_price,

      order_status,
      payment_status,
      delivery_method,

      customer_name,
      phone_number,
      delivery_address,
      delivery_notes,
      admin_notes,

      order_reference_code,
      price_breakdown,

      created_at,
      updated_at,

      profiles:user_id (
        id,
        full_name,
        created_at,
        role
      ),

      order_items (
        id,
        furniture_id,
        selected_variant_id,
        quantity,
        unit_price,
        total_price,
        furniture_snapshot,
        variant_snapshot,
        model_snapshot_url,
        created_at
      ),

      order_timelines (
        id,
        title,
        description,
        metadata,
        created_at
      )
    `)
    .eq("id", orderId)
    .single();

  if (error || !data) {
    throw new Error(error.message || "Admin order not found");
  }

  return {
    ...data,
    user: data.profiles ?? null,
  } as OrderAdmin;
}