"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { FurnitureContext } from "@/hooks/useAIChat";

type AIChatContextType = {
  furnitureContext: FurnitureContext | null;
  setFurnitureContext: (ctx: FurnitureContext | null) => void;
};

const AIChatContext = createContext<AIChatContextType>({
  furnitureContext: null,
  setFurnitureContext: () => {},
});

export function AIChatProvider({ children }: { children: React.ReactNode }) {
  const [furnitureContext, setFurnitureContext] =
    useState<FurnitureContext | null>(null);

  const set = useCallback((ctx: FurnitureContext | null) => {
    setFurnitureContext(ctx);
  }, []);

  return (
    <AIChatContext.Provider
      value={{ furnitureContext, setFurnitureContext: set }}
    >
      {children}
    </AIChatContext.Provider>
  );
}

export function useAIChatContext() {
  return useContext(AIChatContext);
}