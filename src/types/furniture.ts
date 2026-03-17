// types/Furniture.ts

// ---------------- ENUMS ----------------
export type FurnitureSize = "small" | "medium" | "large";

export type OrderStatus =
  | "pending"
  | "rejected"
  | "in_production"
  | "ready_to_claim"
  | "claimed";

export type UserRole = "admin" | "customer";

// ---------------- BASE RELATION TYPES ----------------
export interface FurnitureCategory {
  id: string;
  name: string;
}

export interface FurnitureMaterial {
  id: string;
  name: string;
}

export interface FurnitureColor {
  id: string;
  material_id: string;
  name: string;
  hex_code: string;
}

export interface Profile {
  id: string;
  full_name?: string | null;
  role: UserRole;
  created_at?: string;
}

// Optional helper for joined info in furniture
export interface FurnitureRelation {
  id: string;
  name: string;
  hex_code?: string;
}

// ---------------- FURNITURE TYPES ----------------
// For user-facing pages (lightweight)
export interface FurnitureItem {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  model_url: string;
  thumbnail_url?: string | null;
  base_price?: number | null;
  size?: FurnitureSize | null;
  material_id?: string | null;
  color_id?: string | null;
  category_id?: string | null;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

// For admin / detailed view (joined relations)
export interface FurnitureItemAdmin extends FurnitureItem {
  material?: FurnitureRelation;
  color?: FurnitureRelation;
  category?: FurnitureRelation;
  size_numeric?: number | null; // optional helper to convert size to numeric
  created_by?: Profile;          // who created the furniture
}

// ---------------- FURNITURE CONFIGURATIONS ----------------
export interface FurnitureConfiguration {
  id: string;
  user_id: string;
  furniture_id: string;
  selected_material_id?: string | null;
  selected_color_id?: string | null;
  selected_size?: FurnitureSize | null;
  design_name?: string | null;
  created_at: string;
}

// ---------------- FURNITURE ORDERS ----------------
export interface FurnitureOrder {
  id: string;
  user_id: string;
  configuration_id?: string | null; // can be null if deleted
  furniture_id: string;
  selected_material_id?: string | null;
  selected_color_id?: string | null;
  selected_size?: FurnitureSize | null;
  total_price: number;
  status: OrderStatus;
  notes?: string | null; // for rejection reason or notes
  created_at: string;
}

// ---------------- SELECT OPTION ----------------
export interface SelectOption {
  id: string;
  name: string;
}