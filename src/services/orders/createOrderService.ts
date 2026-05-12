import { supabase } from "@/lib/supabase";
import type { CreateOrderPayload, Order } from "@/types/order";

/**
 * =========================================================
 * CREATE ORDER (FINAL STABLE VERSION)
 * =========================================================
 * - order-level request only
 * - chat message is the single source of truth
 * - safe pricing (no NaN / negative crash)
 * - snapshot guaranteed
 */

export async function createOrder(
  payload: CreateOrderPayload & {
    request?: { description: string } | null;
  }
): Promise<Order> {
  /**
   * =========================================================
   * AUTH
   * =========================================================
   */
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  /**
   * =========================================================
   * ADMIN
   * =========================================================
   */
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  if (!adminProfile) {
    throw new Error("No admin found");
  }

  /**
   * =========================================================
   * USER PROFILE
   * =========================================================
   */
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const fallbackName =
    profile?.full_name ||
    payload.customer_name ||
    user.email ||
    "Unknown Customer";

  /**
   * =========================================================
   * ORDER REFERENCE
   * =========================================================
   */
  const order_reference_code = `ORD-${Date.now()}-${Math.floor(
    Math.random() * 1000
  )}`;

  /**
   * =========================================================
   * REQUEST (ORDER LEVEL ONLY)
   * =========================================================
   */
  const requestText = payload.request?.description?.trim() || null;
  const hasCustomerRequest = !!requestText;

  /**
   * =========================================================
   * ITEMS + TOTAL
   * =========================================================
   */
  const itemsToInsert: any[] = [];
  let quoteTotalPrice = 0;

  for (const item of payload.items) {
    const { data: furniture, error: furnitureError } = await supabase
      .from("furniture")
      .select(`
        id,
        name,
        description,
        base_price,
        model_url,
        width_cm,
        depth_cm,
        height_cm,
        category:furniture_categories(name)
      `)
      .eq("id", item.furniture_id)
      .single();

    if (furnitureError || !furniture) {
      throw new Error("Furniture not found");
    }

    const { data: images } = await supabase
      .from("furniture_images")
      .select("image_url, is_primary")
      .eq("furniture_id", item.furniture_id);

    const { data: variant } = item.variant_id
      ? await supabase
          .from("furniture_variants")
          .select(`
            id,
            name,
            price_adjustment,
            texture_url,
            preview_image_url
          `)
          .eq("id", item.variant_id)
          .single()
      : { data: null };

    /**
     * SAFE PRICING
     */
    const basePrice = Number(furniture.base_price ?? 0);
    const variantPrice = Number(variant?.price_adjustment ?? 0);

    const unitPrice = Math.max(basePrice + variantPrice, 0);
    const quantity = Math.max(Number(item.quantity ?? 0), 0);

    const totalPrice = unitPrice * quantity;

    quoteTotalPrice += totalPrice;

    /**
     * SNAPSHOT
     */
    itemsToInsert.push({
      order_id: "",

      furniture_id: item.furniture_id,
      selected_variant_id: item.variant_id ?? null,

      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,

      furniture_snapshot: {
        id: furniture.id,
        name: furniture.name,
        description: furniture.description,
        base_price: basePrice,
        model_url: furniture.model_url,
        width_cm: furniture.width_cm,
        depth_cm: furniture.depth_cm,
        height_cm: furniture.height_cm,
        category: furniture.category?.name ?? null,
        images: (images ?? []).map((img) => ({
          url: img.image_url,
          isPrimary: img.is_primary,
        })),
      },

      variant_snapshot: variant
        ? {
            id: variant.id,
            name: variant.name,
            price_adjustment: variant.price_adjustment,
            texture_url: variant.texture_url,
            preview_image_url: variant.preview_image_url,
          }
        : null,

      model_snapshot_url: furniture.model_url ?? null,
    });
  }

  /**
   * =========================================================
   * VALIDATION
   * =========================================================
   */
  if (!Number.isFinite(quoteTotalPrice) || quoteTotalPrice <= 0) {
    throw new Error("Invalid order total computed");
  }

  /**
   * =========================================================
   * CREATE ORDER
   * =========================================================
   */
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      delivery_method: payload.delivery_method,
      customer_name: fallbackName,
      phone_number: payload.phone_number ?? null,

      delivery_address:
        payload.delivery_method === "delivery"
          ? payload.delivery_address ?? null
          : null,

      pickup_location:
        payload.delivery_method === "pickup"
          ? payload.pickup_location ??
            "Store: BL Sash Factory, 92 Upper Kalaklan Olongapo City"
          : null,

      delivery_notes: payload.delivery_notes ?? null,

      order_status: "requested",
      payment_status: "unpaid",

      order_reference_code,
      quote_total_price: quoteTotalPrice,

      admin_notes: null,
      has_customer_request: hasCustomerRequest,
    })
    .select("*")
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message || "Order creation failed");
  }

  /**
   * =========================================================
   * INSERT ITEMS
   * =========================================================
   */
  const finalItems = itemsToInsert.map((item) => ({
    ...item,
    order_id: order.id,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(finalItems);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  /**
   * =========================================================
   * CONVERSATION
   * =========================================================
   */
  const { data: conversation } = await supabase
    .from("conversations")
    .insert({
      user_id: user.id,
      admin_id: adminProfile.id,
      order_id: order.id,
    })
    .select("id")
    .single();

  if (!conversation) {
    throw new Error("Conversation creation failed");
  }

  /**
   * =========================================================
   * SYSTEM MESSAGE
   * =========================================================
   */
  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_id: user.id,
    is_system: true,
    message: "Order created successfully.",
    metadata: {
      type: "order_created",
      order_id: order.id,
    },
  });

  /**
   * =========================================================
   * CUSTOMER REQUEST MESSAGE (ORDER LEVEL ONLY)
   * =========================================================
   */
  if (requestText) {
    const { error: requestMsgError } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      is_system: false,
      message: requestText,
      metadata: {
        type: "customer_request",
        scope: "order_level",
      },
    });

    if (requestMsgError) {
      throw new Error(requestMsgError.message);
    }
  }

  return order as Order;
}