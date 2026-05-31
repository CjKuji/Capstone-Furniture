import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createServerClient } from "@/lib/supabase/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// ─── AI CALLER ────────────────────────────────────────────────────────────────
// Swap to Claude by uncommenting the block below and commenting out the Groq one.

async function callAI(
  systemPrompt: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 400, // trimmed from 500 — 400 covers ~300 words, plenty for chat
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
  });
  return response.choices[0]?.message?.content ?? "";
}

// --- ANTHROPIC (swap to this when you have credits) ---
// For spatial math and precision, use claude-sonnet-4-20250514 over haiku.
//
// import Anthropic from "@anthropic-ai/sdk";
// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
//
// async function callAI(
//   systemPrompt: string,
//   messages: { role: string; content: string }[]
// ): Promise<string> {
//   const response = await anthropic.messages.create({
//     model: "claude-sonnet-4-20250514", // Sonnet > Haiku for spatial/math accuracy
//     max_tokens: 400,
//     system: systemPrompt,
//     messages: messages.map((m) => ({
//       role: m.role as "user" | "assistant",
//       content: m.content,
//     })),
//   });
//   return response.content
//     .filter((b) => b.type === "text")
//     .map((b) => (b as { type: "text"; text: string }).text)
//     .join("");
// }

// ─── BASE SYSTEM PROMPT ───────────────────────────────────────────────────────
// Keep this lean. Context (catalog, orders, furniture page) is injected separately.

const BASE_SYSTEM_PROMPT = `You are a furniture shopping assistant for WoodForge, a custom made-to-order furniture store in the Philippines.

Help customers with:
- Furniture recommendations based on space, style, and budget
- Room fit checks — always ask for room dimensions if not provided
- Wood types (Acacia, Mahogany, Narra, Walnut, Oak): pros, cons, durability, price
- Price fairness in the Philippine market
- Care and maintenance tips
- Order and payment status questions
- Honest comparisons and recommendations

SPATIAL RULES (apply whenever fit is discussed):
- Always calculate clearance, not just whether the piece physically fits.
- Dining rooms: 90cm clearance behind chairs to walk freely; 60cm minimum just to sit.
- Bedrooms: 60cm on each side of the bed for walking and side tables.
- If clearance drops below 60cm anywhere, warn the user explicitly.
- Use the furniture's Width x Depth from the catalog or product context.

Order status: requested=waiting review, confirmed=approved, in_production=being built, ready=finished, delivered=complete, cancelled=cancelled.
Payment status: unpaid=none received, partially_paid=deposit received, paid=fully paid.
Delivery: pickup=customer collects, delivery=WoodForge delivers.

Tone: warm, honest, direct. Not a salesperson. If you don't know something, say so.
Length: under 120 words unless the question genuinely needs more.
Format: plain text only. Use double line breaks instead of bullet points for lists. No markdown, no symbols, no headers.

At the very end of every reply, append exactly one tag on its own line: [PRIORITY:LOW], [PRIORITY:MEDIUM], or [PRIORITY:HIGH].
HIGH = ready to buy, asking for a custom quote, or expressing frustration.
MEDIUM = fit checks, catalog questions, comparisons.
LOW = maintenance, wood types, general curiosity.
The frontend will strip this tag before showing it to the user.`;

// ─── CONTEXT FETCHERS ─────────────────────────────────────────────────────────

async function fetchCatalogContext(
  supabase: ReturnType<typeof createServerClient>
): Promise<string | null> {
  const { data: catalog } = await supabase
    .from("furniture")
    .select(`
      name,
      base_price,
      width_cm,
      depth_cm,
      height_cm,
      furniture_categories(name),
      furniture_variants(name, price_adjustment, is_active, is_default)
    `)
    .is("deleted_at", null)
    .eq("publish_status", "published")
    .limit(20);

  if (!catalog || catalog.length === 0) return null;

  // Compact format: one line per item, variants on the same line.
  // "description" omitted — saves tokens, rarely needed for fit/price questions.
  return catalog
    .map((f) => {
      const cat =
        (f.furniture_categories as { name: string } | null)?.name ?? "Other";
      const dims =
        f.width_cm && f.depth_cm && f.height_cm
          ? ` ${f.width_cm}×${f.depth_cm}×${f.height_cm}cm`
          : "";
      const rawVariants = Array.isArray(f.furniture_variants)
        ? f.furniture_variants
        : [];
      const activeVariants = rawVariants
        .filter((v) => v.is_active ?? false)
        .map((v) => {
          const adj = (v.price_adjustment ?? 0) > 0 ? ` +₱${v.price_adjustment}` : "";
          const def = (v.is_default ?? false) ? "*" : "";
          return `${v.name}${adj}${def}`;
        })
        .join("|");
      return (
        `${f.name} (${cat}) ₱${f.base_price}${dims}` +
        (activeVariants ? ` [${activeVariants}]` : "")
      );
    })
    .join("\n");
}

async function fetchOrderContext(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<string | null> {
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      order_reference_code,
      order_status,
      payment_status,
      delivery_method,
      delivery_address,
      pickup_location,
      quote_total_price,
      final_total_price,
      order_items(quantity, unit_price, furniture_snapshot, variant_snapshot),
      order_charges(label, amount, is_additive)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  console.log("[AI] fetchOrderContext userId:", userId, "| orders:", orders?.length ?? 0, error ?? "");

  if (!orders || orders.length === 0) return null;

  return orders
    .map((o) => {
      const items = (Array.isArray(o.order_items) ? o.order_items : [])
        .map((i) => {
          const name = (i.furniture_snapshot as { name?: string } | null)?.name ?? "Item";
          const variant = (i.variant_snapshot as { name?: string } | null)?.name;
          return `${name}${variant ? ` (${variant})` : ""} x${i.quantity ?? 1} ₱${i.unit_price}`;
        })
        .join(", ") || "No items";

      const charges = (Array.isArray(o.order_charges) ? o.order_charges : [])
        .map((c) => `${c.label ?? "Charge"}: ${(c.is_additive ?? true) ? "+" : "-"}₱${c.amount}`)
        .join(", ");

      const total = o.final_total_price ?? o.quote_total_price ?? 0;
      const delivery =
        o.delivery_method === "pickup"
          ? `Pickup${o.pickup_location ? ` @ ${o.pickup_location}` : ""}`
          : `Delivery${o.delivery_address ? ` → ${o.delivery_address}` : ""}`;

      return [
        `Order ${o.order_reference_code}: ${o.order_status} | ${o.payment_status} | ₱${total} | ${delivery}`,
        `  Items: ${items}`,
        charges ? `  Charges: ${charges}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, furnitureContext, userId } = body as {
      messages: { role: string; content: string }[];
      furnitureContext?: {
        name?: string;
        category?: string;
        price?: number;
        width?: number;
        depth?: number;
        height?: number;
        description?: string;
      } | null;
      userId?: string | null;
    };

    console.log("[AI] POST userId:", userId ?? "guest");

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Build system prompt in parts to keep it readable and easy to extend.
    const parts: string[] = [BASE_SYSTEM_PROMPT];

    // 1. Catalog (always injected — compact format)
    try {
      const catalog = await fetchCatalogContext(supabase);
      if (catalog) parts.push(`CATALOG:\n${catalog}`);
    } catch {
      // Non-fatal — continue without catalog
    }

    // 2. Order history (logged-in users only)
    if (userId) {
      try {
        const orders = await fetchOrderContext(supabase, userId);
        parts.push(orders ? `CUSTOMER ORDERS:\n${orders}` : "CUSTOMER ORDERS: none yet.");
      } catch (e) {
        console.error("[AI] Order fetch error:", e);
      }
    } else {
      parts.push("CUSTOMER ORDERS: guest — suggest logging in if they ask about orders.");
    }

    // 3. Product page context (only when viewing a specific item)
    if (furnitureContext) {
      const { name, category, price, width, depth, height, description } = furnitureContext;
      parts.push(
        `CURRENT PRODUCT: ${name ?? "Unknown"} | ${category ?? "N/A"} | ₱${price ?? "?"} | ${width ?? "?"}×${depth ?? "?"}×${height ?? "?"}cm${description ? ` | ${description}` : ""}`
      );
    }

    const systemPrompt = parts.join("\n\n");

    // Only keep the last 8 turns to limit context size (4 exchanges)
    const trimmedMessages = messages.slice(-8);
    const rawReply = await callAI(systemPrompt, trimmedMessages);

    // Strip the [PRIORITY:*] tag before sending to the client.
    // Log it so you can use it for your admin dashboard later.
    const priorityMatch = rawReply.match(/\[PRIORITY:(LOW|MEDIUM|HIGH)\]/i);
    const priority = priorityMatch ? priorityMatch[1].toUpperCase() : "MEDIUM";
    const reply = rawReply.replace(/\[PRIORITY:(LOW|MEDIUM|HIGH)\]\s*$/i, "").trimEnd();

    console.log("[AI] Priority tag:", priority);

    return NextResponse.json({ reply, priority });
  } catch (err) {
    console.error("[AI chat error]", err);
    return NextResponse.json(
      { error: "AI request failed. Please try again." },
      { status: 500 }
    );
  }
}