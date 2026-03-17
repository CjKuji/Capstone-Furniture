"use client";

interface ARViewerProps {
  modelUrl: string;
}

export default function ARViewer({ modelUrl }: ARViewerProps) {
  return (
    <div className="w-full h-screen flex justify-center items-center bg-gray-100">
      <model-viewer
        src={modelUrl}
        alt="AR Furniture"
        ar
        ar-modes="scene-viewer quick-look"
        camera-controls
        auto-rotate
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}