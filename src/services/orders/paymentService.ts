import { supabase } from "@/lib/supabase";

export type CreatePaymentInput = {
  orderId: string;
  userId: string;
  amount: number;
  referenceNumber?: string | null;
  proofImageUrl: string;
};

/**
 * =========================================================
 * PAYMENT SERVICE (DATA LAYER ONLY)
 * =========================================================
 */

export const paymentService = {
  async createPayment(input: CreatePaymentInput) {
    const { data, error } = await supabase
      .from("payments")
      .insert({
        order_id: input.orderId,
        user_id: input.userId,
        amount: input.amount,
        reference_number: input.referenceNumber ?? null,
        proof_image_url: input.proofImageUrl,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPaymentsByOrder(orderId: string) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  async getUserPayments(userId: string) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getPaymentById(paymentId: string) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (error) throw error;
    return data;
  },

  async markPaymentVerified(paymentId: string, adminId: string) {
    const { data, error } = await supabase
      .from("payments")
      .update({
        verified_by: adminId,
        verified_at: new Date().toISOString(),
      })
      .eq("id", paymentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};