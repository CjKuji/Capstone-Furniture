"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useUser } from "@/hooks/useUser";

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

const STORAGE_KEY_PREFIX = "woodforge_cart_v1";

function getStorageKey(userId: string | null): string {
  if (!userId) return STORAGE_KEY_PREFIX + "_guest";
  return STORAGE_KEY_PREFIX + "_" + userId;
}

function loadFromStorage(userId: string | null): CartFurnitureItem[] {
  if (typeof window === "undefined") return [];
  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(userId: string | null, items: CartFurnitureItem[]): void {
  if (typeof window === "undefined") return;
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // quota exceeded or private browsing — fail silently
  }
}

export const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { authUser } = useUser();
  const [items, setItems] = useState<CartFurnitureItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  // Hydrate from localStorage when user changes
  useEffect(() => {
    const userId = authUser?.id ?? null;
    
    // Only reload if user ID has actually changed
    if (userId !== lastUserId) {
      setItems(loadFromStorage(userId));
      setLastUserId(userId);
    }
    
    setHydrated(true);
  }, [authUser?.id, lastUserId]);

  // Persist every time items change (after hydration to avoid overwriting)
  useEffect(() => {
    if (hydrated) {
      const userId = authUser?.id ?? null;
      saveToStorage(userId, items);
    }
  }, [items, hydrated, authUser?.id]);

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