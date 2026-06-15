// lib/chatKeys.ts

export const chatKeys = {
  all: ["chat"] as const,
  
  /**
   * Accepts a polymorphic context identifier string 
   * e.g., "order-UUID", "inquiry-UUID", or a raw fallback ID string
   */
  conversation: (contextKey: string) => ["chat", "conversation", contextKey] as const,

  // Old flat key — kept for any existing code that references it
  messages: (conversationId: string) =>
    ["chat", "messages", conversationId] as const,

  // New paginated key used by useInfiniteQuery
  messagesPaginated: (conversationId: string) =>
    ["chat", "messages-paginated", conversationId] as const,
};