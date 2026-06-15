import { supabase } from '@/lib/supabase';
import { CustomInquiryStatus, FetchInquiriesOptions } from '@/types/inquiry';

export const adminInquiryService = {
  /**
   * Fetches an administrative view of all global custom blueprints in the pipeline
   */
  async fetchAdminInquiries(options?: FetchInquiriesOptions) {
    let query = supabase
      .from('inquiries')
      .select(`
        *,
        profiles:user_id (id, first_name, last_name, email),
        inquiry_items (*, inquiry_images (*)),
        inquiry_charges (*),
        conversation:conversations (*)
      `);

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;
    
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`Admin fetch scope aborted: ${error.message}`);
    return data;
  },

  /**
   * Fetches a single detailed inquiry record by its primary identity key
   */
  async fetchInquiryById(inquiryId: string) {
    if (!inquiryId) throw new Error('Missing parameter entity unique identifier key.');

    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        *,
        profiles:user_id (id, first_name, last_name, email),
        inquiry_items (*, inquiry_images (*)),
        inquiry_charges (*),
        conversation:conversations (*)
      `)
      .eq('id', inquiryId)
      .maybeSingle();

    if (error) throw new Error(`Failed to locate requested inquiry dataset: ${error.message}`);
    return data;
  },

  /**
   * Modifies the custom inquiry state variable inside the workflow pipeline
   */
  async updateInquiryStatus(inquiryId: string, status: CustomInquiryStatus): Promise<void> {
    if (!inquiryId) throw new Error('Missing target inquiry tracking identifier.');
    
    const { error } = await supabase
      .from('inquiries')
      .update({ status })
      .eq('id', inquiryId);

    if (error) throw new Error(`Failed to update status: ${error.message}`);
  }
};