import * as THREE from "three";
import { GLTFExporter, GLTFExporterOptions } from "three/examples/jsm/exporters/GLTFExporter.js";

export interface ExportResult {
  file: File;
  sizeBytes: number;
}

/**
 * Derives the cleaned filename from the original.
 *
 Component	Furniture3DViewer usage	dimensions passed?	AR gets AR info?
 furniture/[id]/page.tsx (public)	Lines 187-191	
 * Examples:
 *   "sofa.glb"        → "sofa-cleaned.glb"
 *   "chair.GLB"       → "chair-cleaned.GLB"
 *   "table_v2"        → "table_v2-cleaned.glb"   (no extension → append .glb)
 */
function buildCleanedFilename(originalName: string): string {
  const dotIndex = originalName.lastIndexOf(".");
  if (dotIndex === -1) {
    // No extension — append suffix and default extension
    return `${originalName}-cleaned.glb`;
  }
  const base = originalName.slice(0, dotIndex);       // "sofa"
  const ext  = originalName.slice(dotIndex);           // ".glb"
  return `${base}-cleaned${ext}`;                      // "sofa-cleaned.glb"
}

/**
 * Serializes a sanitized THREE.Group to a binary GLB File.
 *
 * @param scene         The cleaned/sanitized THREE.Group from modelSanitizer.
 * @param originalName  The original upload filename (e.g. "sofa.glb").
 * @returns             A File whose name is "<base>-cleaned<ext>" and whose
 *                      MIME type is "model/gltf-binary".
 *
 * @throws              If the GLTFExporter calls its error callback, or if the
 *                      result is not an ArrayBuffer (shouldn't happen in binary
 *                      mode, but guarded explicitly).
 */
export async function exportCleanedModel(
  scene: THREE.Group,
  originalName: string
): Promise<ExportResult> {
  const cleanedName = buildCleanedFilename(originalName);

  const options: GLTFExporterOptions = {
    binary: true,           // Produce GLB (binary glTF), not JSON glTF
    embedImages: true,      // Inline textures so the file is self-contained
    onlyVisible: false,     // Export all nodes regardless of visibility flag
    maxTextureSize: 4096,   // Cap texture dimensions for AR performance
  };

  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const exporter = new GLTFExporter();

    exporter.parse(
      scene,
      (result) => {
        // In binary mode the result is always an ArrayBuffer.
        // Guard anyway so type-narrowing is explicit.
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          reject(
            new Error(
              "GLTFExporter returned JSON instead of ArrayBuffer. " +
                "Ensure the `binary: true` option is set."
            )
          );
        }
      },
      (error) => {
        reject(
          new Error(
            `GLTFExporter failed: ${
              error instanceof Error ? error.message : String(error)
            }`
          )
        );
      },
      options
    );
  });

  const file = new File([arrayBuffer], cleanedName, {
    type: "model/gltf-binary",
    lastModified: Date.now(),
  });

  return {
    file,
    sizeBytes: arrayBuffer.byteLength,
  };
}