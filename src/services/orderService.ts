import { supabase } from "@/lib/supabase";
import type { Order } from "@/types/order";

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getOrderById(id: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateOrder(id: string, payload: Partial<Order>) {
  const { data, error } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}