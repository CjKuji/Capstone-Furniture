export const furniturePublicKeys = {
  all: ["furniture-public"] as const,
  list: () => [...furniturePublicKeys.all, "list"] as const,
  detail: (id: string) =>
    [...furniturePublicKeys.all, "detail", id] as const,
};