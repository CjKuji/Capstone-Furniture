"use client";

import { supabase } from "@/lib/supabase";

const BUCKET = "furniture-assets";

/* ================= SAFE HELPERS ================= */

/**
 * Sanitizes filenames to prevent:
 * - broken storage paths
 * - special character issues
 * - cross-platform inconsistencies
 */
function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

/**
 * Generates a collision-safe unique prefix
 */
function generatePrefix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ================= PATH BUILDERS ================= */

export const buildPaths = {
  model: (id: string, file: File) =>
    `models/${id}/${generatePrefix()}-${sanitizeFileName(file.name)}`,

  image: (id: string, file: File) =>
    `gallery/${id}/${generatePrefix()}-${sanitizeFileName(file.name)}`,

  variant: (id: string, file: File) =>
    `variants/${id}/${generatePrefix()}-${sanitizeFileName(file.name)}`,
};

/* ================= UPLOAD ================= */

export async function upload(file: File, path: string) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false, // ❗ FIX: prevents accidental overwrites
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  if (!data?.publicUrl) {
    throw new Error("Failed to generate public URL");
  }

  return data.publicUrl;
}

/* ================= DELETE ================= */

/**
 * Safely extracts storage path from Supabase public URL
 * FIXED: uses URL parsing instead of fragile string matching
 */
function extractPath(url: string): string | null {
  try {
    const u = new URL(url);

    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const index = u.pathname.indexOf(marker);

    if (index === -1) return null;

    return u.pathname.substring(index + marker.length);
  } catch {
    return null;
  }
}

/**
 * Deletes files from Supabase storage safely
 * FIXED: fails loudly instead of silently hiding corruption
 */
export async function removeFiles(urls: string[]) {
  if (!urls.length) return;

  const paths = urls
    .map(extractPath)
    .filter((p): p is string => Boolean(p));

  if (!paths.length) return;

  // Optional: chunking for safety at scale
  const chunkSize = 25;

  for (let i = 0; i < paths.length; i += chunkSize) {
    const chunk = paths.slice(i, i + chunkSize);

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove(chunk);

    if (error) {
      console.error("[Storage cleanup failed]", error.message);
      throw error; // ❗ FIX: prevent silent orphaned files
    }
  }
}