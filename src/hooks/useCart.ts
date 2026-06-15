"use client";

import { useContext } from "react";
import { CartContext, CartProvider } from "@/app/components/CartContext";

export { CartProvider };

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}