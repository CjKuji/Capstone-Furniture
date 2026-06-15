"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

export type CartFurnitureVariant = {
  id: string;
  name: string;
  price_adjustment: number;
};

export type CartFurnitureItem = {
  id: string;
  name: string;
  base_price: number;
  variants: CartFurnitureVariant[];
  // optional display fields persisted so CartPage can render them
  thumbnail_url?: string | null;
  description?: string | null;
  category?: { name: string } | null;
  width_cm?: number | null;
  depth_cm?: number | null;
  height_cm?: number | null;
  hasModel?: boolean;
  imageCount?: number;
};

type CartContextValue = {
  items: CartFurnitureItem[];
  isInCart: (id: string) => boolean;
  toggleItem: (item: CartFurnitureItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  count: number;
};

const STORAGE_KEY = "woodforge_cart_v1";

function loadFromStorage(): CartFurnitureItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: CartFurnitureItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // quota exceeded or private browsing — fail silently
  }
}

export const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartFurnitureItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    setItems(loadFromStorage());
    setHydrated(true);
  }, []);

  // Persist every time items change (after hydration to avoid overwriting)
  useEffect(() => {
    if (hydrated) saveToStorage(items);
  }, [items, hydrated]);

  const isInCart = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  );

  const toggleItem = useCallback((item: CartFurnitureItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      return exists ? prev.filter((i) => i.id !== item.id) : [...prev, item];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider
      value={{
        items,
        isInCart,
        toggleItem,
        removeItem,
        clearCart,
        count: items.length,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}