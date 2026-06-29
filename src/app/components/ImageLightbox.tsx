"use client";

import { useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Move } from "lucide-react";

interface ImageLightboxProps {
  images: { url: string; id?: string }[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function ImageLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title = "Image Preview",
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.5, 0.5);
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      key={`lightbox-${initialIndex}-${isOpen}`}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={handleBackdropClick}
    >
      {/* Header Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className="bg-neutral-900/90 border border-neutral-800 px-4 py-2.5 rounded-xl backdrop-blur-md shadow-2xl pointer-events-auto">
          <p className="text-xs font-bold font-mono text-[#D4A97A] tracking-wide">{title}</p>
          <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">
            Image {currentIndex + 1} of {images.length}
          </p>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Zoom Controls */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl backdrop-blur-md shadow-2xl flex items-center gap-1 p-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-neutral-300 px-2 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResetZoom();
              }}
              className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
              aria-label="Reset zoom"
            >
              <Move className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="rounded-xl bg-neutral-900/90 border border-neutral-800 p-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all duration-200 backdrop-blur-md shadow-2xl active:scale-95"
            aria-label="Close lightbox"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div 
        className="flex-1 flex items-center justify-center overflow-hidden p-16"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          e.preventDefault();
          if (e.deltaY < 0) {
            handleZoomIn();
          } else {
            handleZoomOut();
          }
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleResetZoom}
        style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in" }}
      >
        <img
          src={currentImage.url}
          alt={`${title} - Image ${currentIndex + 1}`}
          className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-neutral-800 select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
          draggable={false}
        />

      {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-xl bg-neutral-900/90 border border-neutral-800 p-4 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all backdrop-blur-sm active:scale-95 shadow-2xl"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-xl bg-neutral-900/90 border border-neutral-800 p-4 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all backdrop-blur-sm active:scale-95 shadow-2xl"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-neutral-900/90 border border-neutral-800 p-3 rounded-2xl shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 overflow-x-auto max-w-[90vw] custom-scrollbar">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                  setZoom(1);
                  setPosition({ x: 0, y: 0 });
                }}
                className={`relative w-16 h-16 rounded-xl border overflow-hidden bg-black flex-shrink-0 transition-all duration-200 ${
                  currentIndex === idx
                    ? "border-[#D4A97A] ring-2 ring-[#D4A97A]/30 scale-105 shadow-xl"
                    : "border-neutral-800 hover:border-neutral-600"
                }`}
              >
                <img
                  src={img.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-6 right-6 bg-neutral-900/80 border border-neutral-800 px-3 py-2 rounded-lg text-[10px] text-neutral-400 backdrop-blur-md">
        <p className="font-medium">Scroll to zoom • Drag to pan • Arrow keys to navigate</p>
      </div>
    </div>
  );
}