"use client";

import type { ImageUI } from "@/types/furniture-ui";
import type {
  DimensionRecommendation,
  ModelDimensions,
  ValidationReport,
} from "@/types/modelValidation";

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
  /** @deprecated No longer used as a gate — GLB upload is always enabled.
   *  Kept in the prop signature so call-sites don't need to change. */
  dimensionsFilled?: boolean;
  isAnalyzing: boolean;
  validationReport: ValidationReport | null;
};

/* ========================================================= */

const labelClass =
  "text-xs font-medium text-white/40 tracking-wide uppercase";

/* ========================================================= */

function ArBadge({ status }: { status: ValidationReport["arReadiness"] }) {
  const config = {
    ready: {
      label: "AR Ready",
      icon: (
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      bg:     "rgba(52,211,153,0.12)",
      border: "rgba(52,211,153,0.3)",
      color:  "#34d399",
    },
    needs_review: {
      label: "Needs Review",
      icon: (
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9"  x2="12"    y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      bg:     "rgba(251,191,36,0.1)",
      border: "rgba(251,191,36,0.3)",
      color:  "#fbbf24",
    },
    not_ready: {
      label: "Not Ready",
      icon: (
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6"  x2="6"  y2="18" />
          <line x1="6"  y1="6"  x2="18" y2="18" />
        </svg>
      ),
      bg:     "rgba(248,113,113,0.1)",
      border: "rgba(248,113,113,0.3)",
      color:  "#f87171",
    },
  } as const;

  const c = config[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
      style={{
        background: c.bg,
        border:     `1px solid ${c.border}`,
        color:      c.color,
      }}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

/* ========================================================= */

function DimensionBar({
  label,
  value,
  min,
  max,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
}) {
  const padding  = (max - min) * 0.25;
  const rangeMin = Math.max(0, min - padding);
  const rangeMax = max + padding;
  const span     = rangeMax - rangeMin;

  const minPct   = ((min   - rangeMin) / span) * 100;
  const maxPct   = ((max   - rangeMin) / span) * 100;
  const valuePct = Math.min(100, Math.max(0, ((value - rangeMin) / span) * 100));

  const inRange  = value >= min && value <= max;
  const dotColor = inRange ? "#34d399" : "#f87171";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-medium"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {label}
        </span>
        <span
          className="text-[10px] font-semibold"
          style={{ color: inRange ? "#34d399" : "#f87171" }}
        >
          {value} cm
        </span>
      </div>

      <div
        className="relative h-1.5 rounded-full w-full"
        style={{ background: "rgba(255,255,255,0.07)" }}
      >
        {/* Recommended zone */}
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            left:       `${minPct}%`,
            width:      `${maxPct - minPct}%`,
            background: "rgba(52,211,153,0.25)",
          }}
        />
        {/* Value dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 shadow"
          style={{
            left:        `calc(${valuePct}% - 5px)`,
            background:  dotColor,
            borderColor: "rgba(0,0,0,0.5)",
          }}
        />
      </div>

      <div className="flex justify-between">
        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          {min} cm
        </span>
        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          {max} cm
        </span>
      </div>
    </div>
  );
}

/* ========================================================= */

function DimensionRecommendationPanel({
  rec,
  enteredDims,
}: {
  rec: DimensionRecommendation;
  enteredDims: ModelDimensions;
}) {
  const statusColor  = rec.withinRange ? "#34d399" : "#fbbf24";
  const statusBg     = rec.withinRange ? "rgba(52,211,153,0.07)"  : "rgba(251,191,36,0.07)";
  const statusBorder = rec.withinRange ? "rgba(52,211,153,0.2)"   : "rgba(251,191,36,0.2)";
  const statusLabel  = rec.withinRange ? "Within typical range"   : "Outside typical range";

  return (
    <div
      className="mt-3 rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div
        className="flex items-center justify-between px-3.5 py-2.5"
        style={{
          background:   "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-2">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(212,169,122,0.7)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          <span
            className="text-[11px] font-semibold capitalize"
            style={{ color: "rgba(212,169,122,0.8)" }}
          >
            {rec.category} — Typical Dimensions
          </span>
        </div>

        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
          style={{
            background: statusBg,
            border:     `1px solid ${statusBorder}`,
            color:      statusColor,
          }}
        >
          {statusLabel}
        </span>
      </div>

      <div
        className="px-3.5 py-3 space-y-3.5"
        style={{ background: "rgba(0,0,0,0.12)" }}
      >
        <DimensionBar
          label="Width"
          value={enteredDims.widthCm}
          min={rec.minWidthCm}
          max={rec.maxWidthCm}
        />
        <DimensionBar
          label="Depth"
          value={enteredDims.depthCm}
          min={rec.minDepthCm}
          max={rec.maxDepthCm}
        />
        <DimensionBar
          label="Height"
          value={enteredDims.heightCm}
          min={rec.minHeightCm}
          max={rec.maxHeightCm}
        />

        {rec.notes.length > 0 && (
          <div className="pt-1 space-y-1.5">
            {rec.notes.map((note, i) => (
              <div
                key={i}
                className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg"
                style={{ background: "rgba(251,191,36,0.06)" }}
              >
                <span
                  className="text-[10px] font-bold mt-px shrink-0"
                  style={{ color: "#fbbf24" }}
                >
                  ⚠
                </span>
                <span
                  className="text-[10px] leading-snug"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {note}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================================================= */

function ValidationReportPanel({ report }: { report: ValidationReport }) {
  if (!report || !Array.isArray(report.findings)) return null;

  const fixed    = report.findings.filter((f) => f.autoFixed);
  const warnings = report.findings.filter((f) => !f.autoFixed && f.severity === "warning");
  const errors   = report.findings.filter((f) => !f.autoFixed && f.severity === "error");
  const infos    = report.findings.filter((f) => !f.autoFixed && f.severity === "info");
  const isEmpty  = report.findings.length === 0;

  const rowStyles = {
    fixed:   { icon: "✓", color: "#34d399", bg: "rgba(52,211,153,0.06)"  },
    warning: { icon: "⚠", color: "#fbbf24", bg: "rgba(251,191,36,0.06)"  },
    error:   { icon: "✕", color: "#f87171", bg: "rgba(248,113,113,0.06)" },
    info:    { icon: "ℹ", color: "#60a5fa", bg: "rgba(96,165,250,0.06)"  },
  } as const;

  function Row({
    message,
    variant,
  }: {
    message: string;
    variant: keyof typeof rowStyles;
  }) {
    const s = rowStyles[variant];
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
        <span
          className="text-[11px] leading-snug"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          {message}
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        className="mt-3 rounded-xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3.5 py-2.5"
          style={{
            background:   "rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-2">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(212,169,122,0.7)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span
              className="text-[11px] font-semibold"
              style={{ color: "rgba(212,169,122,0.8)" }}
            >
              Validation Report
            </span>
          </div>
          <ArBadge status={report.arReadiness} />
        </div>

        {/* Body */}
        <div
          className="p-3 space-y-3"
          style={{ background: "rgba(0,0,0,0.15)" }}
        >
          {isEmpty && (
            <p
              className="text-[11px] text-center py-2"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              No issues found — model is clean.
            </p>
          )}

          {report.autoFixLog.length > 0 && (
            <div className="space-y-1.5">
              <p
                className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: "rgba(52,211,153,0.5)" }}
              >
                Auto-Fixed ({report.autoFixLog.length})
              </p>
              {report.autoFixLog.map((msg, i) => (
                <Row key={i} message={msg} variant="fixed" />
              ))}
            </div>
          )}

          {fixed.length > 0 && (
            <div className="space-y-1.5">
              <p
                className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: "rgba(52,211,153,0.5)" }}
              >
                Corrected ({fixed.length})
              </p>
              {fixed.map((f, i) => (
                <Row key={i} message={f.message} variant="fixed" />
              ))}
            </div>
          )}

          {errors.length > 0 && (
            <div className="space-y-1.5">
              <p
                className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: "rgba(248,113,113,0.5)" }}
              >
                Errors ({errors.length})
              </p>
              {errors.map((f, i) => (
                <Row key={i} message={f.message} variant="error" />
              ))}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="space-y-1.5">
              <p
                className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: "rgba(251,191,36,0.5)" }}
              >
                Warnings ({warnings.length})
              </p>
              {warnings.map((f, i) => (
                <Row key={i} message={f.message} variant="warning" />
              ))}
            </div>
          )}

          {infos.length > 0 && (
            <div className="space-y-1.5">
              <p
                className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: "rgba(96,165,250,0.5)" }}
              >
                Info ({infos.length})
              </p>
              {infos.map((f, i) => (
                <Row key={i} message={f.message} variant="info" />
              ))}
            </div>
          )}

          {report.cleanedSizeBytes != null && (
            <p
              className="text-[10px] text-right pt-1"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              Cleaned file: {(report.cleanedSizeBytes / 1024).toFixed(1)} KB
            </p>
          )}
        </div>
      </div>

      {/* Dimension recommendation — uses detectedDimensions as the displayed value */}
      {report.dimensionRecommendation && (
        <DimensionRecommendationPanel
          rec={report.dimensionRecommendation}
          enteredDims={report.detectedDimensions}
        />
      )}
    </>
  );
}

/* ========================================================= */

function AnalyzingState() {
  return (
    <div
      className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: "rgba(212,169,122,0.05)",
        border:     "1px solid rgba(212,169,122,0.15)",
      }}
    >
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
        <p
          className="text-[12px] font-medium"
          style={{ color: "rgba(212,169,122,0.9)" }}
        >
          Analyzing model…
        </p>
        <p
          className="text-[10px] mt-0.5"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          Detecting geometry, auto-calculating dimensions &amp; scale
        </p>
      </div>
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
  // dimensionsFilled intentionally ignored — upload is always open
  isAnalyzing,
  validationReport,
}: Props) {
  const images = state.images.filter((i) => !i.isDeleted);

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border:     "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* HEADER */}
      <div className="flex items-center gap-3 pb-1">
        <div
          className="w-1 h-5 rounded-full"
          style={{ background: "#D4A97A" }}
        />
        <div>
          <h3 className="text-sm font-semibold text-white">Media Uploads</h3>
          <p className="text-xs mt-0.5" style={{ color: "rgba(212,169,122,0.5)" }}>
            Upload model file first — dimensions are detected automatically
          </p>
        </div>
      </div>

      {/* ── 3D MODEL ── */}
      <div
        className="pb-5 space-y-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-between">
          <label className={labelClass}>3D Model (.glb / .gltf)</label>
          {/* Static hint — no lock state anymore */}
          <span
            className="flex items-center gap-1 text-[10px] font-medium"
            style={{ color: "rgba(212,169,122,0.5)" }}
          >
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Auto-detects dimensions
          </span>
        </div>

        <input
          type="file"
          accept=".glb,.gltf"
          disabled={isAnalyzing}
          onChange={(e) => {
            // Reset the input value so the same file can be re-uploaded
            const file = e.target.files?.[0];
            e.target.value = "";
            setModelFile(file ?? undefined);
          }}
          className={[
            "w-full mt-1.5 rounded-xl px-4 py-2.5 text-sm outline-none transition",
            "border text-white/60",
            "file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-1",
            "file:text-xs file:font-medium file:cursor-pointer file:transition",
            isAnalyzing
              ? "bg-white/[0.02] border-white/[0.05] opacity-50 cursor-not-allowed file:bg-white/10 file:text-white/30 file:cursor-not-allowed"
              : "bg-white/[0.04] border-white/10 file:bg-[#D4A97A]/20 file:text-[#D4A97A] hover:file:bg-[#D4A97A]/30",
          ].join(" ")}
        />

        {/* Pipeline states */}
        {isAnalyzing && <AnalyzingState />}

        {!isAnalyzing && validationReport && (
          <ValidationReportPanel report={validationReport} />
        )}

        {/* Filename confirmation when report isn't shown yet */}
        {state.modelFile && !isAnalyzing && !validationReport && (
          <p
            className="text-xs pl-1"
            style={{ color: "rgba(212,169,122,0.6)" }}
          >
            ✓ {state.modelFile.name}
          </p>
        )}

        {/* Filename in subdued style once report is shown */}
        {state.modelFile && !isAnalyzing && validationReport && (
          <p
            className="text-xs pl-1 mt-1"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            {state.modelFile.name}
          </p>
        )}
      </div>

      {/* ── IMAGES ── */}
      <div className="space-y-3">
        <label className={labelClass}>Product Images</label>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => addImages(e.target.files)}
          className={[
            "w-full mt-1.5 rounded-xl px-4 py-2.5 text-sm outline-none transition",
            "bg-white/[0.04] border border-white/10 text-white/60",
            "file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-1",
            "file:text-xs file:font-medium file:cursor-pointer file:transition",
            "file:bg-[#D4A97A]/20 file:text-[#D4A97A] hover:file:bg-[#D4A97A]/30",
          ].join(" ")}
        />

        {images.length > 0 ? (
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
                  <img
                    src={img.url}
                    className="h-24 w-full object-cover block"
                    alt=""
                  />

                  {img.isPrimary && (
                    <span
                      className="absolute top-1.5 left-1.5 z-20 text-[10px] px-2 py-0.5 rounded-md font-semibold"
                      style={{ background: "#D4A97A", color: "#1C1209" }}
                    >
                      Thumbnail
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => removeImage(key)}
                    className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full flex items-center justify-center text-xs transition"
                    style={{
                      background: "rgba(0,0,0,0.7)",
                      color:      "rgba(255,255,255,0.7)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "#ff6b6b";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "rgba(255,255,255,0.7)";
                    }}
                  >
                    ✕
                  </button>

                  <div className="absolute inset-0 z-10 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: "#D4A97A", color: "#1C1209" }}
                    >
                      Set Thumbnail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="rounded-xl py-6 flex flex-col items-center gap-2 text-center"
            style={{
              background: "rgba(255,255,255,0.02)",
              border:     "1px dashed rgba(255,255,255,0.08)",
            }}
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