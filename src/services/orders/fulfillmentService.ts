import { supabase } from "@/lib/supabase";
import type { FulfillmentStatus } from "@/types/enums";

/**
 * =========================================================
 * FULFILLMENT SERVICE (DATA LAYER ONLY)
 * =========================================================
 * Responsibilities:
 * - update fulfillment_status only
 * - no payment logic
 * - no order logic
 * - no timeline logic
 * =========================================================
 */

export const fulfillmentService = {
  /**
   * START PRODUCTION
   */
  async markInProduction(orderId: string) {
    const { data, error } = await supabase
      .from("orders")
      .update({
        fulfillment_status: "in_production" as FulfillmentStatus,
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * READY FOR PICKUP
   */
  async markReadyForPickup(orderId: string) {
    const { data, error } = await supabase
      .from("orders")
      .update({
        fulfillment_status: "ready_for_pickup" as FulfillmentStatus,
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * READY FOR SHIPPING
   */
  async markReadyForShipping(orderId: string) {
    const { data, error } = await supabase
      .from("orders")
      .update({
        fulfillment_status: "ready_for_shipping" as FulfillmentStatus,
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * PICKED UP (PICKUP FLOW)
   */
  async markPickedUp(orderId: string) {
    const { data, error } = await supabase
      .from("orders")
      .update({
        fulfillment_status: "picked_up" as FulfillmentStatus,
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * SHIPPED (DELIVERY FLOW)
   */
  async markShipped(orderId: string) {
    const { data, error } = await supabase
      .from("orders")
      .update({
        fulfillment_status: "shipped" as FulfillmentStatus,
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * DELIVERED (FINAL STATE BEFORE COMPLETION)
   */
  async markDelivered(orderId: string) {
    const { data, error } = await supabase
      .from("orders")
      .update({
        fulfillment_status: "delivered" as FulfillmentStatus,
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * RESET / HOLD STATE
   */
  async markNotReady(orderId: string) {
    const { data, error } = await supabase
      .from("orders")
      .update({
        fulfillment_status: "not_ready" as FulfillmentStatus,
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};