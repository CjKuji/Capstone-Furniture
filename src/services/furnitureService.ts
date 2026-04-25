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
   DEBUGGER (ENHANCED)
========================================================= */

const DEBUG = true;

function debug(step: string, data?: unknown) {
  if (!DEBUG) return;
  console.log(`[FURNITURE:${step}]`, data);
}

function debugError(step: string, error: unknown, extra?: unknown) {
  console.error(`[FURNITURE:ERROR:${step}]`, error, extra ?? "");
}

/* ========================================================= */

type FurnitureQueryResult = FurnitureDB & {
  furniture_categories: FurnitureCategory | null;
  furniture_images: FurnitureImage[] | null;
  furniture_variants: FurnitureVariant[] | null;
};

/* ========================================================= */

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
  debug("GET_ALL_START");

  const { data, error } = await supabase
    .from("furniture")
    .select(`
      *,
      furniture_categories:category_id (id, name),
      furniture_images (*),
      furniture_variants (*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    debugError("GET_ALL", error);
    throw error;
  }

  const result = (data ?? []).map((item) =>
    normalizeFurniture(item as FurnitureQueryResult)
  );

  debug("GET_ALL_SUCCESS", { count: result.length });

  return result;
}

/* =========================================================
   GET BY ID
========================================================= */

export async function getFurnitureById(id: string) {
  debug("GET_BY_ID_START", id);

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

  if (error) {
    debugError("GET_BY_ID", error, id);
    throw error;
  }

  if (!data) throw new Error("Furniture not found");

  const result = normalizeFurniture(data as FurnitureQueryResult);

  debug("GET_BY_ID_SUCCESS", id);

  return result;
}

/* =========================================================
   CREATE (FULL DEBUG)
========================================================= */

export async function createFurniture(
  payload: FurnitureFormPayload,
  userId: string
) {
  debug("CREATE_START_PAYLOAD", payload);
  debug("CREATE_START_USER", userId);

  try {
    if (!userId) throw new Error("userId is required");

    validateImages(payload.images ?? []);
    validateVariants(payload.variants ?? []);

    const dims = payload.dimensions;

    const safeName = payload.name.trim();

    const slug =
      safeName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") +
      "-" +
      Date.now();

    debug("CREATE_SLUG", slug);

    /* =========================================================
       INSERT MAIN ROW
    ========================================================= */

    const { data, error } = await supabase
      .from("furniture")
      .insert({
        name: safeName,
        slug,
        description: payload.description ?? null,
        category_id: payload.categoryId ?? null,
        base_price: payload.basePrice ?? 0,
        created_by: userId,

        width_cm: dims?.widthCm ?? null,
        depth_cm: dims?.depthCm ?? null,
        height_cm: dims?.heightCm ?? null,

        model_url: null,
      })
      .select()
      .single();

    if (error) {
      debugError("CREATE_INSERT", error, payload);
      throw error;
    }

    const id = data.id;

    debug("CREATE_INSERT_SUCCESS", { id, data });

    /* =========================================================
       MODEL UPLOAD
    ========================================================= */

    if (payload.modelFile instanceof File) {
      debug("MODEL_UPLOAD_START");

      const url = await upload(
        payload.modelFile,
        buildPaths.model(id, payload.modelFile)
      );

      debug("MODEL_UPLOAD_URL", url);

      const { error: modelError } = await supabase
        .from("furniture")
        .update({ model_url: url })
        .eq("id", id);

      if (modelError) {
        debugError("MODEL_UPDATE", modelError);
        throw modelError;
      }

      debug("MODEL_UPLOAD_DONE");
    }

    /* =========================================================
       CHILDREN
    ========================================================= */

    debug("IMAGES_CREATE_START", payload.images);
    await createImages(id, payload.images ?? [], false);

    debug("VARIANTS_CREATE_START", payload.variants);
    await createVariants(id, payload.variants ?? []);

    /* =========================================================
       FINAL FETCH
    ========================================================= */

    const final = await getFurnitureById(id);

    debug("CREATE_SUCCESS_FINAL", final);

    return final;
  } catch (err) {
    debugError("CREATE_FATAL", err, payload);
    throw err;
  }
}

/* =========================================================
   UPDATE (DEBUG)
========================================================= */

export async function updateFurniture(
  id: string,
  payload: FurnitureFormPayload
) {
  debug("UPDATE_START", { id, payload });

  try {
    validateImages(payload.images ?? []);
    validateVariants(payload.variants ?? []);

    const dims = payload.dimensions;

    const { error } = await supabase
      .from("furniture")
      .update({
        name: payload.name,
        description: payload.description ?? null,
        base_price: payload.basePrice ?? 0,

        width_cm: dims?.widthCm ?? null,
        depth_cm: dims?.depthCm ?? null,
        height_cm: dims?.heightCm ?? null,

        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      debugError("UPDATE_MAIN", error);
      throw error;
    }

    debug("UPDATE_MAIN_SUCCESS");

    /* MODEL */
    if (payload.modelFile instanceof File) {
      debug("MODEL_UPDATE_START");

      const url = await upload(
        payload.modelFile,
        buildPaths.model(id, payload.modelFile)
      );

      const { error: modelError } = await supabase
        .from("furniture")
        .update({ model_url: url })
        .eq("id", id);

      if (modelError) {
        debugError("MODEL_UPDATE", modelError);
        throw modelError;
      }

      debug("MODEL_UPDATE_DONE");
    }

    await updateImages(id, payload.images ?? []);
    await updateVariants(id, payload.variants ?? []);

    const result = await getFurnitureById(id);

    debug("UPDATE_SUCCESS", result);

    return result;
  } catch (err) {
    debugError("UPDATE_FATAL", err, payload);
    throw err;
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function deleteFurniture(id: string) {
  debug("DELETE_START", id);

  const item = await getFurnitureById(id);

  const imageUrls = (item.furniture_images ?? []).map(
    (i) => i.image_url
  );

  const variantUrls = (item.furniture_variants ?? []).map(
    (v) => v.texture_url
  );

  const urls = [
    item.model_url,
    ...imageUrls,
    ...variantUrls,
  ].filter(Boolean) as string[];

  debug("DELETE_FILES", urls);

  if (urls.length > 0) {
    await removeFiles(urls);
  }

  const { error } = await supabase
    .from("furniture")
    .delete()
    .eq("id", id);

  if (error) {
    debugError("DELETE", error);
    throw error;
  }

  debug("DELETE_SUCCESS", id);
}

/* =========================================================
   CATEGORIES
========================================================= */

export async function getCategories(): Promise<FurnitureCategory[]> {
  debug("CATEGORIES_START");

  const { data, error } = await supabase
    .from("furniture_categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    debugError("CATEGORIES", error);
    throw error;
  }

  debug("CATEGORIES_SUCCESS", data?.length);

  return data ?? [];
}