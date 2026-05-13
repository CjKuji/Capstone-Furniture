"use client";

import { supabase } from "@/lib/supabase";

import type {
  CreateOrderPayload,
  Order,
} from "@/types/order";

/**
 * =========================================================
 * TYPES
 * =========================================================
 */

type FurnitureSnapshot = {
  id: string;
  slug: string;

  name: string;
  description: string | null;

  base_price: number;

  dimensions: {
    width_cm: number | null;
    depth_cm: number | null;
    height_cm: number | null;
  };

  category: string | null;

  model_url: string | null;

  primary_image_url: string | null;

  images: {
    url: string;
    isPrimary: boolean;
  }[];

  catalog_version: number;

  snapshot_created_at: string;
};

type VariantSnapshot = {
  id: string;

  name: string;

  price_adjustment: number;

  texture_url: string;

  preview_image_url: string | null;

  snapshot_created_at: string;
};

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

function safeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

function createFurnitureSnapshot(params: {
  furniture: any;
  images: any[];
}): FurnitureSnapshot {
  const { furniture, images } = params;

  const primaryImage =
    images?.find((img) => img.is_primary)?.image_url ??
    images?.[0]?.image_url ??
    null;

  return {
    id: furniture.id,

    slug: furniture.slug,

    name: furniture.name,

    description: furniture.description ?? null,

    base_price: safeNumber(furniture.base_price),

    dimensions: {
      width_cm: furniture.width_cm ?? null,
      depth_cm: furniture.depth_cm ?? null,
      height_cm: furniture.height_cm ?? null,
    },

    category: furniture.category?.name ?? null,

    model_url: furniture.model_url ?? null,

    primary_image_url: primaryImage,

    images: (images ?? []).map((img) => ({
      url: img.image_url,
      isPrimary: Boolean(img.is_primary),
    })),

    catalog_version: furniture.catalog_version ?? 1,

    snapshot_created_at: new Date().toISOString(),
  };
}

function createVariantSnapshot(
  variant: any
): VariantSnapshot | null {
  if (!variant) {
    return null;
  }

  return {
    id: variant.id,

    name: variant.name,

    price_adjustment: safeNumber(
      variant.price_adjustment
    ),

    texture_url: variant.texture_url,

    preview_image_url:
      variant.preview_image_url ?? null,

    snapshot_created_at:
      new Date().toISOString(),
  };
}

/**
 * =========================================================
 * CREATE ORDER
 * =========================================================
 */

export async function createOrder(
  payload: CreateOrderPayload & {
    request?: {
      description: string;
    } | null;
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
   * VALIDATE ITEMS
   * =========================================================
   */

  if (
    !payload.items ||
    payload.items.length === 0
  ) {
    throw new Error(
      "Order must contain at least one item"
    );
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
   * REQUEST
   * =========================================================
   */

  const requestText =
    payload.request?.description?.trim() ||
    null;

  const hasCustomerRequest =
    !!requestText;

  /**
   * =========================================================
   * BUILD ORDER ITEMS
   * =========================================================
   */

  const itemsToInsert: any[] = [];

  let quoteTotalPrice = 0;

  for (const item of payload.items) {
    /**
     * -----------------------------------------------------
     * VALIDATE QUANTITY
     * -----------------------------------------------------
     */

    const quantity = Math.max(
      safeNumber(item.quantity),
      1
    );

    /**
     * -----------------------------------------------------
     * LOAD FURNITURE
     * -----------------------------------------------------
     */

    const {
      data: furniture,
      error: furnitureError,
    } = await supabase
      .from("furniture")
      .select(`
        id,
        slug,
        name,
        description,
        base_price,
        model_url,

        width_cm,
        depth_cm,
        height_cm,

        catalog_version,

        category:furniture_categories(name)
      `)
      .eq("id", item.furniture_id)
      .is("deleted_at", null)
      .single();

    if (furnitureError || !furniture) {
      throw new Error(
        "Furniture not found"
      );
    }

    /**
     * -----------------------------------------------------
     * LOAD IMAGES
     * -----------------------------------------------------
     */

    const { data: images } = await supabase
      .from("furniture_images")
      .select(`
        image_url,
        is_primary
      `)
      .eq(
        "furniture_id",
        item.furniture_id
      );

    /**
     * -----------------------------------------------------
     * LOAD VARIANT
     * IMPORTANT:
     * VALIDATE VARIANT BELONGS
     * TO FURNITURE
     * -----------------------------------------------------
     */

    let variant: any = null;

    if (item.variant_id) {
      const {
        data: variantData,
        error: variantError,
      } = await supabase
        .from("furniture_variants")
        .select(`
          id,
          furniture_id,
          name,
          price_adjustment,
          texture_url,
          preview_image_url
        `)
        .eq("id", item.variant_id)
        .eq(
          "furniture_id",
          item.furniture_id
        )
        .eq("is_active", true)
        .single();

      if (
        variantError ||
        !variantData
      ) {
        throw new Error(
          "Invalid furniture variant"
        );
      }

      variant = variantData;
    }

    /**
     * -----------------------------------------------------
     * SAFE PRICING
     * -----------------------------------------------------
     */

    const basePrice = Math.max(
      safeNumber(furniture.base_price),
      0
    );

    const variantPrice = Math.max(
      safeNumber(
        variant?.price_adjustment
      ),
      0
    );

    const unitPrice =
      basePrice + variantPrice;

    const totalPrice =
      unitPrice * quantity;

    quoteTotalPrice += totalPrice;

    /**
     * -----------------------------------------------------
     * SNAPSHOTS
     * -----------------------------------------------------
     */

    const furnitureSnapshot =
      createFurnitureSnapshot({
        furniture,
        images: images ?? [],
      });

    const variantSnapshot =
      createVariantSnapshot(variant);

    /**
     * -----------------------------------------------------
     * ORDER ITEM
     * -----------------------------------------------------
     */

    itemsToInsert.push({
      order_id: "",

      /**
       * Optional references only
       * (not source of truth)
       */
      furniture_id:
        item.furniture_id,

      selected_variant_id:
        item.variant_id ?? null,

      quantity,

      unit_price: unitPrice,

      total_price: totalPrice,

      /**
       * Immutable snapshots
       */
      furniture_snapshot:
        furnitureSnapshot,

      variant_snapshot:
        variantSnapshot,

      model_snapshot_url:
        furniture.model_url ?? null,
    });
  }

  /**
   * =========================================================
   * FINAL TOTAL VALIDATION
   * =========================================================
   */

  if (
    !Number.isFinite(
      quoteTotalPrice
    ) ||
    quoteTotalPrice <= 0
  ) {
    throw new Error(
      "Invalid order total computed"
    );
  }

  /**
   * =========================================================
   * CREATE ORDER
   * =========================================================
   */

  const {
    data: order,
    error: orderError,
  } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,

      admin_id: adminProfile.id,

      customer_name:
        fallbackName,

      phone_number:
        payload.phone_number ??
        null,

      delivery_method:
        payload.delivery_method,

      delivery_address:
        payload.delivery_method ===
        "delivery"
          ? payload.delivery_address ??
            null
          : null,

      pickup_location:
        payload.delivery_method ===
        "pickup"
          ? payload.pickup_location ??
            "Store: BL Sash Factory, 92 Upper Kalaklan Olongapo City"
          : null,

      delivery_notes:
        payload.delivery_notes ??
        null,

      order_reference_code,

      quote_total_price:
        quoteTotalPrice,

      order_status:
        "requested",

      payment_status:
        "unpaid",

      has_customer_request:
        hasCustomerRequest,

      admin_notes: null,
    })
    .select("*")
    .single();

  if (orderError || !order) {
    throw new Error(
      orderError?.message ||
        "Order creation failed"
    );
  }

  /**
   * =========================================================
   * INSERT ORDER ITEMS
   * =========================================================
   */

  const finalItems =
    itemsToInsert.map((item) => ({
      ...item,
      order_id: order.id,
    }));

  const {
    error: itemsError,
  } = await supabase
    .from("order_items")
    .insert(finalItems);

  if (itemsError) {
    /**
     * Basic rollback cleanup
     * (until full DB transaction/RPC exists)
     */

    await supabase
      .from("orders")
      .delete()
      .eq("id", order.id);

    throw new Error(
      itemsError.message
    );
  }

  /**
   * =========================================================
   * CREATE CONVERSATION
   * =========================================================
   */

  const {
    data: conversation,
    error: conversationError,
  } = await supabase
    .from("conversations")
    .insert({
      user_id: user.id,

      admin_id:
        adminProfile.id,

      order_id: order.id,
    })
    .select("id")
    .single();

  if (
    conversationError ||
    !conversation
  ) {
    throw new Error(
      "Conversation creation failed"
    );
  }

  /**
   * =========================================================
   * SYSTEM MESSAGE
   * =========================================================
   */

  await supabase
    .from("messages")
    .insert({
      conversation_id:
        conversation.id,

      sender_id: user.id,

      sender_type: "system",

      is_system: true,

      message:
        "Order created successfully.",

      metadata: {
        type: "order_created",

        order_id: order.id,
      },
    });

  /**
   * =========================================================
   * CUSTOMER REQUEST MESSAGE
   * =========================================================
   */

  if (requestText) {
    const {
      error: requestMsgError,
    } = await supabase
      .from("messages")
      .insert({
        conversation_id:
          conversation.id,

        sender_id: user.id,

        sender_type:
          "customer",

        is_system: false,

        message: requestText,

        metadata: {
          type:
            "customer_request",

          scope:
            "order_level",
        },
      });

    if (requestMsgError) {
      throw new Error(
        requestMsgError.message
      );
    }
  }

  /**
   * =========================================================
   * RETURN ORDER
   * =========================================================
   */

  return order as Order;
}