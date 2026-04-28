import { supabase } from "@/lib/supabase";
import type { CreateOrderPayload, Order } from "@/types/order";

export async function createOrder(
  payload: CreateOrderPayload
): Promise<Order> {
  /*
  =========================================================
  STEP 0: AUTH
  =========================================================
  */
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  /*
  =========================================================
  STEP 1: ADMIN
  =========================================================
  */
  const { data: adminProfile, error: adminError } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  if (adminError || !adminProfile) {
    throw new Error("No admin found");
  }

  /*
  =========================================================
  STEP 2: FETCH FURNITURE
  =========================================================
  */
  const { data: furniture, error: furnitureError } = await supabase
    .from("furniture")
    .select(`
      id,
      name,
      description,
      model_url,
      base_price,
      width_cm,
      depth_cm,
      height_cm,
      category_id,
      furniture_categories (
        name
      )
    `)
    .eq("id", payload.furniture_id)
    .single();

  if (furnitureError || !furniture) {
    throw new Error("Furniture not found");
  }

  /*
  =========================================================
  STEP 3: FETCH VARIANT
  =========================================================
  */
  const { data: variant } = payload.variant_id
    ? await supabase
        .from("furniture_variants")
        .select(
          "id, name, texture_url, preview_image_url, price_adjustment"
        )
        .eq("id", payload.variant_id)
        .single()
    : { data: null };

  /*
  =========================================================
  STEP 4: FETCH IMAGES
  =========================================================
  */
  const { data: images } = await supabase
    .from("furniture_images")
    .select("image_url, is_primary")
    .eq("furniture_id", payload.furniture_id)
    .order("sort_order", { ascending: true });

  /*
  =========================================================
  STEP 5: CATEGORY SAFE RESOLVE
  =========================================================
  */
  const categoryName =
    (furniture as any).furniture_categories?.name ??
    (furniture as any).furniture_categories?.[0]?.name ??
    null;

  /*
  =========================================================
  STEP 6: SNAPSHOT
  =========================================================
  */
  const furnitureSnapshot = {
    id: furniture.id,
    name: furniture.name,
    description: furniture.description ?? null,

    base_price: furniture.base_price,

    width_cm: furniture.width_cm,
    depth_cm: furniture.depth_cm,
    height_cm: furniture.height_cm,

    category: categoryName,

    model_url: furniture.model_url,

    images: (images ?? []).map((img) => ({
      url: img.image_url,
      isPrimary: img.is_primary,
    })),
  };

  const variantSnapshot = variant
    ? {
        id: variant.id,
        name: variant.name,
        texture_url: variant.texture_url,
        preview_image_url: variant.preview_image_url,
        price_adjustment: variant.price_adjustment,
      }
    : null;

  /*
  =========================================================
  STEP 7: PRICE CALCULATION
  =========================================================
  */
  const unitPrice =
    Number(furniture.base_price ?? 0) +
    Number(variant?.price_adjustment ?? 0);

  /*
  =========================================================
  STEP 8: ORDER CODE
  =========================================================
  */
  const orderReferenceCode = `ORD-${Date.now()}-${Math.floor(
    Math.random() * 1000
  )}`;

  /*
  =========================================================
  STEP 9: CUSTOMER NAME
  =========================================================
  */
  const finalCustomerName =
    payload.delivery_method === "pickup"
      ? user.email
      : payload.customer_name ?? user.email;

  /*
  =========================================================
  STEP 10: CREATE ORDER (FIXED STATUS HERE)
  =========================================================
  */
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,

      delivery_method: payload.delivery_method,

      customer_name: finalCustomerName,
      phone_number: payload.phone_number ?? null,

      delivery_address:
        payload.delivery_method === "pickup"
          ? "STORE PICKUP"
          : payload.delivery_address ?? null,

      delivery_notes: payload.delivery_notes ?? null,

      /**
       * ✅ FIXED: correct enum field
       * was: status: "pending_review" ❌
       */
      order_status: "requested",

      payment_status: "unpaid",

      order_reference_code: orderReferenceCode,

      quote_total_price: null,
      admin_notes: null,
      price_breakdown: null,
    })
    .select("*")
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message || "Order creation failed");
  }

  /*
  =========================================================
  STEP 11: ORDER ITEM
  =========================================================
  */
  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id,
    furniture_id: payload.furniture_id,
    selected_variant_id: payload.variant_id ?? null,

    quantity: 1,
    unit_price: unitPrice,
    total_price: unitPrice,

    furniture_snapshot: furnitureSnapshot,
    variant_snapshot: variantSnapshot,

    model_snapshot_url: furniture.model_url ?? null,
  });

  if (itemError) {
    throw new Error(itemError.message);
  }

  /*
  =========================================================
  STEP 12: CONVERSATION
  =========================================================
  */
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({
      user_id: user.id,
      admin_id: adminProfile.id,
      order_id: order.id,
    })
    .select("id")
    .single();

  if (convError || !conversation) {
    throw new Error("Conversation creation failed");
  }

  /*
  =========================================================
  STEP 13: SYSTEM MESSAGE
  =========================================================
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

  return order as Order;
}