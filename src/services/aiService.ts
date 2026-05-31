/**
 * AI service for the furniture store assistant.
 * Calls your Next.js API route which proxies to Anthropic.
 * Keep the API key server-side only.
 */

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AskAIOptions {
  messages: AIMessage[];
  /** Optional order context injected into the system prompt */
  orderContext?: {
    orderId: string;
    referenceCode: string;
    status: string;
    items: { name: string; quantity: number; price: number }[];
    totalPrice: number;
  };
  /** Whether this is an admin asking (gets extra pricing/business context) */
  isAdmin?: boolean;
}

export async function askAI(options: AskAIOptions): Promise<string> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "AI request failed");
  }

  const data = await res.json();
  return data.reply as string;
}