import { supabase } from "@/lib/supabase";
import type { OrderTimelineEventType } from "@/types/enums";

/**
 * =========================================================
 * TIMELINE SERVICE
 * =========================================================
 * Responsibilities:
 * - append immutable order history events
 * - audit trail for admin + user actions
 * - NO business logic
 * =========================================================
 */

export const timelineService = {
  /**
   * ADD ORDER TIMELINE EVENT
   */
  async log(params: {
    orderId: string;
    actorId: string;
    event: OrderTimelineEventType;
    title: string;
    description?: string;
    metadata?: Record<string, any>;
  }) {
    const { orderId, actorId, event, title, description, metadata } = params;

    const { error } = await supabase.from("order_timelines").insert({
      order_id: orderId,
      actor_id: actorId,
      title,
      description: description ?? null,
      metadata: {
        event,
        ...metadata,
      },
    });

    if (error) throw error;
  },
};