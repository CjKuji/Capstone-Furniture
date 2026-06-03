"use client";

import type { ImageUI } from "@/types/furniture-ui";

/* ========================================================= */

export type ValidationItem = {
  message: string;
};

export type ValidationReport = {
  autoFixed: ValidationItem[];
  warnings: ValidationItem[];
  errors: ValidationItem[];
  /** Derived from the counts above — consumer may compute or pass explicitly */
  arStatus: "ready" | "needs-review" | "not-ready";
};

/* ========================================================= */

type AssetsState = {
  modelFile?: File;
  images: ImageUI[];
};

type Props = {
  state: AssetsState;
  setModelFile: (file?: File) => void;
  addImages: (files: FileList | null) => void;
  removeImage: (key: string) => void;
  setPrimaryImage: (key: string) => void;
  /** All three dimension fields are filled with positive values */
  dimensionsFilled: boolean;
  /** GLB is currently being analyzed / cleaned */
  isAnalyzing: boolean;
  /** Populated once analysis is complete */
  validationReport: ValidationReport | null;
};

/* ========================================================= */

const labelClass = "text-xs font-medium text-white/40 tracking-wide uppercase";

/* ========================================================= */

function ArBadge({ status }: { status: ValidationReport["arStatus"] }) {
  const config = {
    ready: {
      label: "AR Ready",
      icon: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      bg: "rgba(52,211,153,0.12)",
      border: "rgba(52,211,153,0.3)",
      color: "#34d399",
    },
    "needs-review": {
      label: "Needs Review",
      icon: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      bg: "rgba(251,191,36,0.1)",
      border: "rgba(251,191,36,0.3)",
      color: "#fbbf24",
    },
    "not-ready": {
      label: "Not Ready",
      icon: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ),
      bg: "rgba(248,113,113,0.1)",
      border: "rgba(248,113,113,0.3)",
      color: "#f87171",
    },
  } as const;

  const c = config[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

/* ========================================================= */

function ReportRow({
  item,
  variant,
}: {
  item: ValidationItem;
  variant: "fixed" | "warning" | "error";
}) {
  const styles = {
    fixed: { icon: "✓", color: "#34d399", bg: "rgba(52,211,153,0.06)" },
    warning: { icon: "⚠", color: "#fbbf24", bg: "rgba(251,191,36,0.06)" },
    error: { icon: "✕", color: "#f87171", bg: "rgba(248,113,113,0.06)" },
  } as const;

  const s = styles[variant];

  return (
    <div
      className="flex items-start gap-2.5 px-3 py-2 rounded-lg"
      style={{ background: s.bg }}
    >
      <span
        className="mt-px text-[11px] font-bold shrink-0 leading-none"
        style={{ color: s.color }}
      >
        {s.icon}
      </span>
      <span className="text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.65)" }}>
        {item.message}
      </span>
    </div>
  );
}

/* ========================================================= */

function ValidationReportPanel({ report }: { report: ValidationReport }) {
  const hasFixed = report.autoFixed.length > 0;
  const hasWarnings = report.warnings.length > 0;
  const hasErrors = report.errors.length > 0;
  const isEmpty = !hasFixed && !hasWarnings && !hasErrors;

  return (
    <div
      className="mt-3 rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Report header */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5"
        style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(212,169,122,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span className="text-[11px] font-semibold" style={{ color: "rgba(212,169,122,0.8)" }}>
            Validation Report
          </span>
        </div>
        <ArBadge status={report.arStatus} />
      </div>

      {/* Report body */}
      <div className="p-3 space-y-3" style={{ background: "rgba(0,0,0,0.15)" }}>
        {isEmpty && (
          <p className="text-[11px] text-center py-2" style={{ color: "rgba(255,255,255,0.25)" }}>
            No issues found — model is clean.
          </p>
        )}

        {hasFixed && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "rgba(52,211,153,0.5)" }}>
              Auto-Fixed ({report.autoFixed.length})
            </p>
            {report.autoFixed.map((item, i) => (
              <ReportRow key={i} item={item} variant="fixed" />
            ))}
          </div>
        )}

        {hasWarnings && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "rgba(251,191,36,0.5)" }}>
              Warnings ({report.warnings.length})
            </p>
            {report.warnings.map((item, i) => (
              <ReportRow key={i} item={item} variant="warning" />
            ))}
          </div>
        )}

        {hasErrors && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "rgba(248,113,113,0.5)" }}>
              Errors ({report.errors.length})
            </p>
            {report.errors.map((item, i) => (
              <ReportRow key={i} item={item} variant="error" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================================================= */

function AnalyzingState() {
  return (
    <div
      className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: "rgba(212,169,122,0.05)",
        border: "1px solid rgba(212,169,122,0.15)",
      }}
    >
      {/* Spinner */}
      <svg
        className="shrink-0 animate-spin"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#D4A97A"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <div>
        <p className="text-[12px] font-medium" style={{ color: "rgba(212,169,122,0.9)" }}>
          Analyzing model…
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
          Normalizing geometry, pivots &amp; scale
        </p>
      </div>
    </div>
  );
}

/* ========================================================= */

function GlbGate() {
  return (
    <div
      className="mt-2 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px dashed rgba(255,255,255,0.1)",
      }}
    >
      {/* lock icon */}
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
        Fill in all three dimension fields above to enable model upload.
      </p>
    </div>
  );
}

/* ========================================================= */

export default function AssetsSection({
  state,
  setModelFile,
  addImages,
  removeImage,
  setPrimaryImage,
  dimensionsFilled,
  isAnalyzing,
  validationReport,
}: Props) {
  const images = state.images.filter((i) => !i.isDeleted);

  const fileInputClass = `
    w-full mt-1.5 rounded-xl px-4 py-2.5 text-sm outline-none transition
    border text-white/60
    file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-1
    file:text-xs file:font-medium file:cursor-pointer file:transition
    ${
      dimensionsFilled
        ? "bg-white/[0.04] border-white/10 file:bg-[#D4A97A]/20 file:text-[#D4A97A] hover:file:bg-[#D4A97A]/30"
        : "bg-white/[0.02] border-white/[0.05] opacity-40 cursor-not-allowed file:bg-white/10 file:text-white/30 file:cursor-not-allowed"
    }
  `.trim();

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* HEADER */}
      <div className="flex items-center gap-3 pb-1">
        <div className="w-1 h-5 rounded-full" style={{ background: "#D4A97A" }} />
        <div>
          <h3 className="text-sm font-semibold text-white">Media Uploads</h3>
          <p className="text-xs mt-0.5" style={{ color: "rgba(212,169,122,0.5)" }}>
            Upload model files and product images
          </p>
        </div>
      </div>

      {/* 3D MODEL */}
      <div
        className="pb-5 space-y-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Label row */}
        <div className="flex items-center justify-between">
          <label className={labelClass}>3D Model (.glb / .gltf)</label>
          {dimensionsFilled ? (
            <span
              className="flex items-center gap-1 text-[10px] font-medium"
              style={{ color: "rgba(52,211,153,0.7)" }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Dimensions set
            </span>
          ) : (
            <span
              className="flex items-center gap-1 text-[10px] font-medium"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Locked
            </span>
          )}
        </div>

        <input
          type="file"
          accept=".glb,.gltf,.obj"
          disabled={!dimensionsFilled || isAnalyzing}
          onChange={(e) => setModelFile(e.target.files?.[0] ?? undefined)}
          className={fileInputClass}
        />

        {/* Gate message */}
        {!dimensionsFilled && <GlbGate />}

        {/* Analyzing spinner */}
        {dimensionsFilled && isAnalyzing && <AnalyzingState />}

        {/* Validation report */}
        {dimensionsFilled && !isAnalyzing && validationReport && (
          <ValidationReportPanel report={validationReport} />
        )}

        {/* Filename confirmation (only when not analyzing and no report yet) */}
        {state.modelFile && !isAnalyzing && !validationReport && (
          <p className="text-xs pl-1" style={{ color: "rgba(212,169,122,0.6)" }}>
            ✓ {state.modelFile.name}
          </p>
        )}

        {/* Filename alongside report */}
        {state.modelFile && !isAnalyzing && validationReport && (
          <p className="text-xs pl-1 mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
            {state.modelFile.name}
          </p>
        )}
      </div>

      {/* IMAGES */}
      <div className="space-y-3">
        <label className={labelClass}>Product Images</label>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => addImages(e.target.files)}
          className={`
            w-full mt-1.5 rounded-xl px-4 py-2.5 text-sm outline-none transition
            bg-white/[0.04] border border-white/10 text-white/60
            file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-1
            file:text-xs file:font-medium file:cursor-pointer
            file:transition file:bg-[#D4A97A]/20 file:text-[#D4A97A]
            hover:file:bg-[#D4A97A]/30
          `.trim()}
        />

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            {images.map((img) => {
              const key = img.id ?? img.clientId;
              return (
                <div
                  key={key}
                  className="relative group rounded-xl overflow-hidden"
                  style={{
                    border: img.isPrimary
                      ? "1.5px solid #D4A97A"
                      : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <img src={img.url} className="h-24 w-full object-cover block" alt="" />

                  {img.isPrimary && (
                    <span
                      className="absolute top-1.5 left-1.5 z-20 text-[10px] px-2 py-0.5 rounded-md font-semibold"
                      style={{ background: "#D4A97A", color: "#1C1209" }}
                    >
                      Thumbnail
                    </span>
                  )}

                  <button
                    onClick={() => removeImage(key)}
                    className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full flex items-center justify-center text-xs transition"
                    style={{ background: "rgba(0,0,0,0.7)", color: "rgba(255,255,255,0.7)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = "#ff6b6b";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
                    }}
                  >
                    ✕
                  </button>

                  <div className="absolute inset-0 z-10 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => setPrimaryImage(key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      style={{ background: "#D4A97A", color: "#1C1209" }}
                    >
                      Set Thumbnail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {images.length === 0 && (
          <div
            className="rounded-xl py-6 flex flex-col items-center gap-2 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
          >
            <span className="text-2xl opacity-30">🖼️</span>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
              No images uploaded yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}