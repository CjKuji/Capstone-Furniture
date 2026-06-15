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
      final_total_price,
      charge_status,

      order_status,
      payment_status,
      delivery_method,

      customer_name,
      phone_number,
      delivery_address,
      pickup_location,
      delivery_notes,
      admin_notes,

      order_reference_code,
      created_at,
      updated_at,

      order_items:order_items!order_items_order_id_fkey (
        id,
        order_id,
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

      order_charges:order_charges!order_charges_order_id_fkey (
        id,
        order_id,
        type,
        label,
        amount,
        is_additive,
        created_by,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch orders");
  }

  return (data ?? []) as unknown as Order[];
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
      final_total_price,
      charge_status,

      order_status,
      payment_status,
      delivery_method,

      customer_name,
      phone_number,
      delivery_address,
      pickup_location,
      delivery_notes,
      admin_notes,

      order_reference_code,
      created_at,
      updated_at,

      order_items:order_items!order_items_order_id_fkey (
        id,
        order_id,
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

      order_charges:order_charges!order_charges_order_id_fkey (
        id,
        order_id,
        type,
        label,
        amount,
        is_additive,
        created_by,
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

  return data as unknown as Order;
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
      final_total_price,
      charge_status,

      order_status,
      payment_status,
      delivery_method,

      customer_name,
      phone_number,
      delivery_address,
      pickup_location,
      delivery_notes,
      admin_notes,

      order_reference_code,
      created_at,
      updated_at,

      profiles:user_id!inner (
        id,
        first_name,
        middle_initial,
        last_name,
        created_at,
        role
      ),

      order_items:order_items!order_items_order_id_fkey (
        id,
        order_id,
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

      order_charges:order_charges!order_charges_order_id_fkey (
        id,
        order_id,
        type,
        label,
        amount,
        is_additive,
        created_by,
        created_at
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch admin orders");
  }

  return (data ?? []).map((item: any) => {
    const rawProfile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
    
    // Stitch dynamic full name for consistency within front-end UI structures
    let computedFullName = null;
    if (rawProfile) {
      const formattedMI = rawProfile.middle_initial ? `${rawProfile.middle_initial.trim().replace('.', '')}.` : "";
      computedFullName = [rawProfile.first_name, formattedMI, rawProfile.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();
    }

    return {
      ...item,
      user: rawProfile
        ? {
            ...rawProfile,
            full_name: computedFullName || "Unknown Customer"
          }
        : null,
    };
  }) as unknown as OrderAdmin[];
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
      final_total_price,
      charge_status,

      order_status,
      payment_status,
      delivery_method,

      customer_name,
      phone_number,
      delivery_address,
      pickup_location,
      delivery_notes,
      admin_notes,

      order_reference_code,
      created_at,
      updated_at,

      profiles:user_id!inner (
        id,
        first_name,
        middle_initial,
        last_name,
        created_at,
        role
      ),

      order_items:order_items!order_items_order_id_fkey (
        id,
        order_id,
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

      order_charges:order_charges!order_charges_order_id_fkey (
        id,
        order_id,
        type,
        label,
        amount,
        is_additive,
        created_by,
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

  const rawProfile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  
  let computedFullName = null;
  if (rawProfile) {
    const formattedMI = rawProfile.middle_initial ? `${rawProfile.middle_initial.trim().replace('.', '')}.` : "";
    computedFullName = [rawProfile.first_name, formattedMI, rawProfile.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  return {
    ...data,
    user: rawProfile
      ? {
          ...rawProfile,
          full_name: computedFullName || "Unknown Customer"
        }
      : null,
  } as unknown as OrderAdmin;
}