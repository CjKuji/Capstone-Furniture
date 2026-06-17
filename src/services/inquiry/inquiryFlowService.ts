import { SupabaseClient } from '@supabase/supabase-js';
import { CustomInquiryStatus, FetchInquiriesOptions } from '@/types/inquiry';

export interface InquiryTransitionResult {
  success: boolean;
  message: string;
  inquiry?: any;
}

export class InquiryFlowService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Fetch paginated and filterable lists of customer inquiries
   */
  async getInquiries(options: FetchInquiriesOptions = {}): Promise<{ data: any[] | null; count: number | null; error: any }> {
    const { status, limit = 10, offset = 0 } = options;

    let query = this.supabase
      .from('inquiries')
      .select('*, inquiry_items(*), profiles!inquiries_user_id_fkey(*)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { data, count, error };
  }

  /**
   * Transition 1: Accept an inquiry to begin technical evaluation and pricing
   * Status change: 'requested' -> 'under_review'
   */
  async acceptForReview(inquiryId: string, adminId: string): Promise<InquiryTransitionResult> {
    return this.transitionStatus(inquiryId, 'under_review', ['requested'], { admin_id: adminId }, async () => {
      await this.assignAdminToConversation(inquiryId, adminId);
    });
  }

  /**
   * Transition 2: Clear billing records and move directly to the fabrication workshop floor
   * Status change: 'under_review' -> 'in_production'
   */
  async approvePaymentToProduction(inquiryId: string): Promise<InquiryTransitionResult> {
    // Condition verification: Ensure at least one charge item is configured before approving
    const { count, error: countError } = await this.supabase
      .from('inquiry_charges')
      .select('*', { count: 'exact', head: true })
      .eq('inquiry_id', inquiryId);

    if (countError) return { success: false, message: `Database checking error: ${countError.message}` };
    if (!count || count === 0) {
      return { success: false, message: 'Cannot push to production: Add at least one row item charge first.' };
    }

    // Directly transitions from under_review to in_production
    return this.transitionStatus(inquiryId, 'in_production', ['under_review']);
  }

  /**
   * Transition 3: Completed workshop builds and route fulfillment handling
   * Status change: 'in_production' -> 'ready_for_pickup' | 'ready_for_shipment'
   */
  async markProductionComplete(inquiryId: string, deliveryMethod: 'pickup' | 'delivery'): Promise<InquiryTransitionResult> {
    const targetStatus: CustomInquiryStatus = deliveryMethod === 'pickup' ? 'ready_for_pickup' : 'ready_for_shipment';
    return this.transitionStatus(inquiryId, targetStatus, ['in_production']);
  }

  /**
   * Transition 4: Order dispatched onto courier tracks
   * Status change: 'ready_for_shipment' -> 'in_transit'
   */
  async dispatchShipment(inquiryId: string): Promise<InquiryTransitionResult> {
    return this.transitionStatus(inquiryId, 'in_transit', ['ready_for_shipment']);
  }

  /**
   * Transition 5: Finalize the transaction process lifecycle
   */
  async completeInquiry(inquiryId: string): Promise<InquiryTransitionResult> {
    return this.transitionStatus(inquiryId, 'completed', ['in_transit', 'ready_for_pickup']);
  }

  /**
   * Transition 6: Master cancel drop control
   */
  async cancelInquiry(inquiryId: string, reason: string): Promise<InquiryTransitionResult> {
    const nonCancellable: CustomInquiryStatus[] = ['completed', 'cancelled'];
    
    try {
      const { data: inquiry, error: fetchError } = await this.supabase
        .from('inquiries')
        .select('status')
        .eq('id', inquiryId)
        .single();

      if (fetchError || !inquiry) return { success: false, message: 'Inquiry structural record not found.' };
      if (nonCancellable.includes(inquiry.status as CustomInquiryStatus)) {
        return { success: false, message: `Inquiry cannot be cancelled from its active state: '${inquiry.status}'` };
      }

      const { data: updatedInquiry, error: updateError } = await this.supabase
        .from('inquiries')
        .update({
          status: 'cancelled' as CustomInquiryStatus,
          cancel_reason: reason,
          cancel_status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', inquiryId)
        .select()
        .single();

      if (updateError) throw updateError;

      return { success: true, message: 'Inquiry safely closed out and cancelled.', inquiry: updatedInquiry };
    } catch (err: any) {
      return { success: false, message: `Execution cancellation aborted: ${err.message}` };
    }
  }

  /**
   * Core Reusable Engine for State Transitions
   */
  private async transitionStatus(
    inquiryId: string,
    nextStatus: CustomInquiryStatus,
    allowedPriorStates: CustomInquiryStatus[],
    additionalPayload: Record<string, any> = {},
    postHook?: () => Promise<void>
  ): Promise<InquiryTransitionResult> {
    try {
      const { data: inquiry, error: fetchError } = await this.supabase
        .from('inquiries')
        .select('id, status')
        .eq('id', inquiryId)
        .single();

      if (fetchError || !inquiry) {
        return { success: false, message: 'Inquiry record matching criteria not found.' };
      }

      if (!allowedPriorStates.includes(inquiry.status as CustomInquiryStatus)) {
        return {
          success: false,
          message: `Invalid state step. Target action needs prior states [${allowedPriorStates.join(', ')}]. Found: '${inquiry.status}'`
        };
      }

      const { data: updatedInquiry, error: updateError } = await this.supabase
        .from('inquiries')
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
          ...additionalPayload
        })
        .eq('id', inquiryId)
        .select()
        .single();

      if (updateError) throw updateError;

      if (postHook) {
        await postHook();
      }

      return {
        success: true,
        message: `Status advanced to ${nextStatus} without issue.`,
        inquiry: updatedInquiry
      };
    } catch (error: any) {
      return { success: false, message: `Workflow interruption encounter: ${error.message}` };
    }
  }

  /**
   * Helper utility to update admin bindings within chat threads
   */
  private async assignAdminToConversation(inquiryId: string, adminId: string): Promise<void> {
    await this.supabase
      .from('conversations')
      .update({
        admin_id: adminId,
        updated_at: new Date().toISOString()
      })
      .eq('inquiry_id', inquiryId);
  }
}