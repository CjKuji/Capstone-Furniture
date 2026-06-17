import { SupabaseClient } from "@supabase/supabase-js";

export interface CreateInquiryChargeInput {
  inquiryId: string;
  type: string;
  label: string;
  amount: number;
  isAdditive?: boolean;
  createdBy: string;
}

export interface UpdateInquiryChargeInput {
  chargeId: string;
  type?: string;
  label?: string;
  amount?: number;
  isAdditive?: boolean;
}

export const inquiryChargeService = {
  /**
   * Updates the charge status to 'pending' whenever a modification occurs.
   * Keeps the inquiry status untouched so it stays under review.
   */
  async resetAndAdvanceInquiryStatus(supabase: SupabaseClient, inquiryId: string) {
    const { error } = await supabase
      .from("inquiries")
      .update({ 
        charge_status: 'pending'
      }) 
      .eq("id", inquiryId);
      
    if (error) throw error;
  },

  /**
   * Creates a new charge item associated with an inquiry.
   */
  async createCharge(supabase: SupabaseClient, input: CreateInquiryChargeInput) {
    if (input.amount < 0) throw new Error("Amounts cannot be negative.");
    
    const { data, error } = await supabase
      .from("inquiry_charges")
      .insert({
        inquiry_id: input.inquiryId,
        type: input.type,
        label: input.label,
        amount: input.amount,
        is_additive: input.isAdditive ?? true,
        created_by: input.createdBy,
      })
      .select("*")
      .single();
      
    if (error) throw error;
    
    await this.resetAndAdvanceInquiryStatus(supabase, input.inquiryId);
    return data;
  },

  /**
   * Fetches charges for a specific inquiry.
   */
  async getChargesByInquiry(supabase: SupabaseClient, inquiryId: string, userId?: string) {
    let query = supabase
      .from("inquiry_charges")
      .select(`
        *, 
        creator:profiles!inquiry_charges_created_by_fkey(first_name, last_name, email),
        inquiry:inquiries!inner(user_id)
      `)
      .eq("inquiry_id", inquiryId);

    if (userId) {
      query = query.eq("inquiry.user_id", userId);
    }

    const { data, error } = await query.order("created_at", { ascending: true });
    
    if (error) throw error;
    return data;
  },

  /**
   * Updates only the provided fields of a charge.
   */
  async updateCharge(supabase: SupabaseClient, inquiryId: string, input: UpdateInquiryChargeInput) {
    if (input.amount !== undefined && input.amount < 0) {
      throw new Error("Amounts cannot be negative.");
    }
    
    const updatePayload: Record<string, any> = {};
    if (input.type !== undefined) updatePayload.type = input.type;
    if (input.label !== undefined) updatePayload.label = input.label;
    if (input.amount !== undefined) updatePayload.amount = input.amount;
    if (input.isAdditive !== undefined) updatePayload.is_additive = input.isAdditive;

    const { data, error } = await supabase
      .from("inquiry_charges")
      .update(updatePayload)
      .eq("id", input.chargeId)
      .select("*")
      .single();
      
    if (error) throw error;
    
    await this.resetAndAdvanceInquiryStatus(supabase, inquiryId);
    return data;
  },

  /**
   * Deletes a specific charge item from an inquiry.
   */
  async deleteCharge(supabase: SupabaseClient, inquiryId: string, chargeId: string) {
    const { error } = await supabase
      .from("inquiry_charges")
      .delete()
      .eq("id", chargeId);
      
    if (error) throw error;
    
    await this.resetAndAdvanceInquiryStatus(supabase, inquiryId);
    return { id: chargeId, success: true };
  },

  /**
   * Finalizes the inquiry charges.
   * Keeps the inquiry workflow status safely locked within 'under_review'.
   */
  async finalizeInquiryCharges(
    supabase: SupabaseClient,
    inquiryId: string,
    status: 'accepted' | 'rejected'
  ) {
    const { data: charges, error: fetchError } = await supabase
      .from("inquiry_charges")
      .select("amount, is_additive")
      .eq("inquiry_id", inquiryId);

    if (fetchError) throw fetchError;

    const computedTotal = (charges || []).reduce((acc, c) => {
      return c.is_additive ? acc + Number(c.amount) : acc - Number(c.amount);
    }, 0);

    const total = Math.max(0, computedTotal);

    const { error: updateError } = await supabase
      .from("inquiries")
      .update({
        charge_status: status,
        final_total_price: status === 'accepted' ? total : 0,
        // REMAIN ON UNDER_REVIEW: No intermediate payment states used
        status: 'under_review'
      })
      .eq("id", inquiryId);

    if (updateError) throw updateError;
    return { success: true };
  }
};