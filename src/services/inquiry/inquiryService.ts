// src/services/inquiryService.ts
import { supabase } from '@/lib/supabase';

// =========================================================================
// 1. DATA TRANSLATION INTERFACES & TYPES
// =========================================================================
export type CustomInquiryStatus = 
  | 'requested'
  | 'under_review'
  | 'quote_ready'
  | 'awaiting_payment'
  | 'verifying_payment'
  | 'in_production'
  | 'ready_for_pickup'
  | 'ready_for_shipment'
  | 'in_transit'
  | 'completed'
  | 'cancelled';

export interface CreateInquiryItemInput {
  title?: string | null;
  description: string;
  image_urls: string[]; 
  quantity?: number;
}

export interface CreateInquiryPayload {
  delivery_method: 'pickup' | 'delivery';
  phone_number?: string | null;
  delivery_address?: string | null;
  pickup_location?: string | null;
  items: CreateInquiryItemInput[];
}

export interface FetchInquiriesOptions {
  status?: CustomInquiryStatus; 
  limit?: number;
  offset?: number;
}

function generateInquiryReference(): string {
  const now = new Date();
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day   = String(now.getDate()).padStart(2, "0");
  const datePart = `${year}${month}${day}`;

  const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  return `INQ-${datePart}-${suffix}`;
}

interface InsertInquiryRow {
  user_id: string;
  delivery_method: 'pickup' | 'delivery';
  phone_number: string | null;
  delivery_address: string | null;
  pickup_location: string | null;
  status: 'requested';
  inquiry_reference_code: string;
}

interface InsertInquiryItemRow {
  inquiry_id: string;
  title: string | null;
  description: string;
  quantity: number;
}

interface InsertInquiryImageRow {
  inquiry_item_id: string;
  image_url: string;
  sort_order: number;
}

// Fixed interface to reflect that the database expects a strict string for admin_id.
// If your database allows NULL, omit the key entirely from the object during insertion 
// instead of passing literal `null`.
interface InsertConversationRow {
  user_id: string;
  admin_id: string; 
  inquiry_id: string;
  customer_unread_count: number;
  admin_unread_count: number;
  last_message: string | null;
  last_message_at: string | null;
}

// =========================================================================
// 2. UNIFIED INQUIRY SERVICE LAYER
// =========================================================================
export const inquiryService = {
  createInquiry: async (payload: CreateInquiryPayload) => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      throw new Error('Authentication failure. You must be signed in to submit custom blueprints.');
    }
    
    const userId = authData.user.id;
    const { items, ...parentDetails } = payload;

    if (!items || items.length === 0) {
      throw new Error('Inquiry layout validation error: At least one custom element block is required.');
    }

    // 1. Resolve an available admin ID to assign as the operational thread manager
    let assignedAdminId: string | null = null;
    try {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin') 
        .limit(1)
        .maybeSingle();
      
      if (adminProfile?.id) {
        assignedAdminId = adminProfile.id;
      }
    } catch (e) {
      console.warn("Could not auto-assign conversation supervisor:", e);
    }

    // 2. Generate a unique reference code for this inquiry
    const inquiry_reference_code = generateInquiryReference();

    // 3. Insert parent inquiry record
    const parentRow: InsertInquiryRow = {
      user_id: userId,
      delivery_method: parentDetails.delivery_method,
      phone_number: parentDetails.phone_number ?? null,
      delivery_address: parentDetails.delivery_method === 'delivery' ? (parentDetails.delivery_address ?? null) : null,
      pickup_location: parentDetails.delivery_method === 'pickup' ? (parentDetails.pickup_location ?? null) : null,
      status: 'requested',
      inquiry_reference_code,
    };

    const { data: parentRecord, error: parentError } = await supabase
      .from('inquiries')
      .insert(parentRow as any)
      .select('id, inquiry_reference_code')
      .single();

    if (parentError) {
      throw new Error(`Failed to initialize inquiry record container: ${parentError.message}`);
    }

    const assignedInquiryId = parentRecord.id;

    try {
      // 3. Batch insert structural items
      const itemsToInsert: InsertInquiryItemRow[] = items.map((item) => ({
        inquiry_id: assignedInquiryId,
        title: item.title ?? null,
        description: item.description,
        quantity: Math.max(1, item.quantity ?? 1),
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from('inquiry_items')
        .insert(itemsToInsert)
        .select('id');

      if (itemsError) throw itemsError;
      if (!insertedItems || insertedItems.length !== items.length) {
        throw new Error('Mismatch error in returned database child item batch size indexes.');
      }

      // 4. Extract and map media files
      const imageRowsToInsert: InsertInquiryImageRow[] = [];
      insertedItems.forEach((insertedItem, index) => {
        const structuralInputItem = items[index];
        if (structuralInputItem.image_urls && structuralInputItem.image_urls.length > 0) {
          structuralInputItem.image_urls.forEach((url, urlIdx) => {
            imageRowsToInsert.push({
              inquiry_item_id: insertedItem.id,
              image_url: url,
              sort_order: urlIdx
            });
          });
        }
      });

      if (imageRowsToInsert.length > 0) {
        const { error: imagesError } = await supabase
          .from('inquiry_images')
          .insert(imageRowsToInsert);

        if (imagesError) throw imagesError;
      }

      // 5. Initialize the communication layer record
      // Constructing dynamic object payload to avoid passing null if your schema marks it required.
      // If `assignedAdminId` is missing, we use a fallback string or pass an empty string, depending on your schema setup.
      const conversationRow = {
        user_id: userId,
        admin_id: assignedAdminId || "", // Ensures a string type match. Change fallback if you use a system UUID default instead.
        inquiry_id: assignedInquiryId,
        customer_unread_count: 0,
        admin_unread_count: 0, 
        last_message: `Inquiry Submitted: "${items[0].title || 'Custom Project Details'}"`,
        last_message_at: new Date().toISOString()
      };

      const { error: conversationError } = await supabase
        .from('conversations')
        .insert(conversationRow);

      if (conversationError) throw conversationError;

      return {
        success: true,
        inquiryId: assignedInquiryId,
        itemsCount: insertedItems.length,
        imagesCount: imageRowsToInsert.length
      };

    } catch (childBatchError: any) {
      // Cascade delete parent container to clean up partial records if an error occurs
      await supabase
        .from('inquiries')
        .delete()
        .eq('id', assignedInquiryId);

      throw new Error(`Inquiry batch transaction aborted. Custom child parameters rejected: ${childBatchError.message}`);
    }
  },

  fetchUserInquiries: async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      throw new Error('Authentication error: You must be signed in to view your inquiries.');
    }

    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        *,
        inquiry_items (
          *,
          inquiry_images (*)
        ),
        inquiry_charges (*),
        conversations (*)
      `)
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch user inquiries: ${error.message}`);
    return data;
  },

  fetchInquiryById: async (inquiryId: string) => {
    if (!inquiryId) throw new Error('Missing parameter entity unique identifier key.');

    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        *,
        profiles:user_id (
          id,
          first_name,
          last_name,
          email
        ),
        inquiry_items (
          *,
          inquiry_images (*)
        ),
        inquiry_charges (*),
        conversations (*)
      `)
      .eq('id', inquiryId)
      .single();

    if (error) throw new Error(`Failed to locate requested inquiry dataset: ${error.message}`);
    return data;
  }
};