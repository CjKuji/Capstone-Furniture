export const chatKeys = {
  conversation: (orderId: string) => ["conversation", orderId] as const,
  messages: (conversationId: string) =>
    ["messages", conversationId] as const,
};