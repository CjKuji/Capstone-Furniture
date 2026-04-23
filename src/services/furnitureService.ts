"use client";

import { supabase } from "@/lib/supabase";

import type {
  FurnitureItemAdmin,
  FurnitureFormPayload,
  FurnitureCategory,
  FurnitureDB,
  FurnitureImage,
  FurnitureVariant,
} from "@/types/furniture";

import { upload, buildPaths, removeFiles } from "@/services/storageService";

import {
  createImages,
  updateImages,
  validateImages,
} from "@/services/handlers/imageHandlers";

import {
  createVariants,
  updateVariants,
  validateVariants,
} from "@/services/handlers/variantHandlers";

/* =========================================================
   SAFE QUERY TYPE
========================================================= */

type FurnitureQueryResult = FurnitureDB & {
  furniture_categories: FurnitureCategory | null;
  furniture_images: FurnitureImage[] | null;
  furniture_variants: FurnitureVariant[] | null;
};

/* =========================================================
   NORMALIZER
========================================================= */

function normalizeFurniture(
  data: FurnitureQueryResult
): FurnitureItemAdmin {
  return {
    ...data,
    furniture_categories: data.furniture_categories ?? null,
    furniture_images: data.furniture_images ?? [],
    furniture_variants: data.furniture_variants ?? [],
  };
}

/* =========================================================
   READ ALL
========================================================= */

export async function getFurniture(): Promise<FurnitureItemAdmin[]> {
  const { data, error } = await supabase
    .from("furniture")
    .select(`
      *,
      furniture_categories:category_id (id, name),
      furniture_images (*),
      furniture_variants (*)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((item) =>
    normalizeFurniture(item as FurnitureQueryResult)
  );
}

/* =========================================================
   READ BY ID
========================================================= */

export async function getFurnitureById(id: string) {
  const { data, error } = await supabase
    .from("furniture")
    .select(`
      *,
      furniture_categories:category_id (id, name),
      furniture_images (*),
      furniture_variants (*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Furniture not found");

  return normalizeFurniture(data as FurnitureQueryResult);
}

/* =========================================================
   CREATE
========================================================= */

export async function createFurniture(
  payload: FurnitureFormPayload,
  userId?: string
) {
  validateImages(payload.images ?? []);
  validateVariants(payload.variants ?? []);

  const slug =
    payload.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") +
    "-" +
    Date.now();

  const { data, error } = await supabase
    .from("furniture")
    .insert({
      name: payload.name,
      slug,
      description: payload.description ?? null,
      category_id: payload.categoryId ?? null,
      base_price: payload.basePrice,
      created_by: userId ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  const id = data.id;

  /* ---------- MODEL ---------- */
  if (payload.modelFile) {
    const url = await upload(
      payload.modelFile,
      buildPaths.model(id, payload.modelFile)
    );

    const { error: modelError } = await supabase
      .from("furniture")
      .update({ model_url: url })
      .eq("id", id);

    if (modelError) throw modelError;
  }

  /* ---------- CHILD ENTITIES ---------- */
  await createImages(id, payload.images ?? []);
  await createVariants(id, payload.variants ?? []);

  return getFurnitureById(id);
}

/* =========================================================
   UPDATE
========================================================= */

export async function updateFurniture(
  id: string,
  payload: FurnitureFormPayload
) {
  validateImages(payload.images ?? []);
  validateVariants(payload.variants ?? []);

  const { error } = await supabase
    .from("furniture")
    .update({
      name: payload.name,
      description: payload.description ?? null,
      base_price: payload.basePrice,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;

  /* ---------- MODEL REPLACEMENT ---------- */
  if (payload.modelFile) {
    const url = await upload(
      payload.modelFile,
      buildPaths.model(id, payload.modelFile)
    );

    const { error: modelError } = await supabase
      .from("furniture")
      .update({ model_url: url })
      .eq("id", id);

    if (modelError) throw modelError;
  }

  /* ---------- SYNC CHILD ENTITIES ---------- */
  await updateImages(id, payload.images ?? []);
  await updateVariants(id, payload.variants ?? []);

  return getFurnitureById(id);
}

/* =========================================================
   DELETE (SAFE + FULL CLEANUP)
========================================================= */

export async function deleteFurniture(id: string) {
  const item = await getFurnitureById(id);

  const imageUrls =
    item.furniture_images?.map((i) => i.image_url) ?? [];

  const variantUrls =
    item.furniture_variants?.map((v) => v.texture_url) ?? [];

  const urls = [
    item.model_url,
    ...imageUrls,
    ...variantUrls,
  ].filter(Boolean) as string[];

  if (urls.length) {
    await removeFiles(urls);
  }

  const { error } = await supabase
    .from("furniture")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* =========================================================
   CATEGORIES
========================================================= */

export async function getCategories(): Promise<FurnitureCategory[]> {
  const { data, error } = await supabase
    .from("furniture_categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}