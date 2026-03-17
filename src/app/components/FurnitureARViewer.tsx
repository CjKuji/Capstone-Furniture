"use client";

import React, { useEffect } from "react";

interface FurnitureARViewerProps {
  modelUrl: string;
  selectedSize?: number; // scale multiplier
}

export default function FurnitureARViewer({
  modelUrl,
  selectedSize = 1,
}: FurnitureARViewerProps) {
  const scale = `${selectedSize} ${selectedSize} ${selectedSize}`;

  useEffect(() => {
    const loadScripts = async () => {
      if (!document.getElementById("aframe")) {
        const aframe = document.createElement("script");
        aframe.src = "https://aframe.io/releases/1.4.2/aframe.min.js";
        aframe.id = "aframe";
        aframe.async = true;
        document.body.appendChild(aframe);
      }

      if (!document.getElementById("arjs")) {
        const arjs = document.createElement("script");
        arjs.src =
          "https://cdn.rawgit.com/jeromeetienne/AR.js/3.3.2/aframe/build/aframe-ar.js";
        arjs.id = "arjs";
        arjs.async = true;
        document.body.appendChild(arjs);
      }
    };
    loadScripts();
  }, []);

  return (
    <div className="w-full h-[500px] bg-gray-100 rounded-lg shadow-md">
      <a-scene
        className="ar-scene"
        embedded
        arjs="trackingMethod: best; sourceType: webcam;"
      >
        {/* Marker */}
        <a-marker preset="hiro">
          <a-entity
            gltf-model={modelUrl}
            scale={scale}
            position="0 0 0"
            rotation="0 0 0"
          ></a-entity>
        </a-marker>

        {/* Camera */}
        <a-entity camera></a-entity>
      </a-scene>
    </div>
  );
}