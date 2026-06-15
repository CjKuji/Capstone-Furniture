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

export interface FetchInquiriesOptions {
  status?: CustomInquiryStatus; 
  limit?: number;
  offset?: number;
}