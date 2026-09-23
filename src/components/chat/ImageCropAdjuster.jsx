import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Move,
  RotateCcw,
  UploadCloud,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { calculateCropCoordinates } from "../../lib/utils/chat/chatTheme";

export default function ImageCropAdjuster({
  file,
  onApply = async () => {},
  onCancel = () => {},
  loading = false,
}) {
  const [imageSrc, setImageSrc] = useState("");
  const [naturalDims, setNaturalDims] = useState({ width: 0, height: 0 });
  const [viewportDims, setViewportDims] = useState({ width: 340, height: 210 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const viewportRef = useRef(null);
  const imgRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const offsetStartRef = useRef({ x: 0, y: 0 });

  // Create and clean up object URL for the uploaded file
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setZoom(1);
    setOffset({ x: 0, y: 0 });

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Update viewport dimensions on mount / resize
  const updateViewportDims = useCallback(() => {
    if (viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewportDims({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    }
  }, []);

  useEffect(() => {
    updateViewportDims();
    window.addEventListener("resize", updateViewportDims);
    return () => window.removeEventListener("resize", updateViewportDims);
  }, [updateViewportDims]);

  // Handle image load
  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setNaturalDims({ width: naturalWidth, height: naturalHeight });
    updateViewportDims();
  };

  // Calculate current crop box & clamp offsets
  const cropInfo = calculateCropCoordinates({
    viewportWidth: viewportDims.width,
    viewportHeight: viewportDims.height,
    naturalWidth: naturalDims.width,
    naturalHeight: naturalDims.height,
    zoom,
    offset,
  });

  // Handle zoom changes and clamp existing offset
  const handleZoomChange = (nextZoom) => {
    const safeNextZoom = Math.max(1, Math.min(3, nextZoom));
    setZoom(safeNextZoom);

    // Re-clamp offset with the new zoom factor
    const newCrop = calculateCropCoordinates({
      viewportWidth: viewportDims.width,
      viewportHeight: viewportDims.height,
      naturalWidth: naturalDims.width,
      naturalHeight: naturalDims.height,
      zoom: safeNextZoom,
      offset,
    });
    setOffset({
      x: newCrop.clampedOffsetX,
      y: newCrop.clampedOffsetY,
    });
  };

  // Drag interaction with Pointer Events
  const handlePointerDown = (e) => {
    if (loading) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignored if capture unsupported
    }
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    offsetStartRef.current = { ...offset };
  };

  const handlePointerMove = (e) => {
    if (!isDragging || loading) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const rawX = offsetStartRef.current.x + dx;
    const rawY = offsetStartRef.current.y + dy;

    const clamped = calculateCropCoordinates({
      viewportWidth: viewportDims.width,
      viewportHeight: viewportDims.height,
      naturalWidth: naturalDims.width,
      naturalHeight: naturalDims.height,
      zoom,
      offset: { x: rawX, y: rawY },
    });

    setOffset({
      x: clamped.clampedOffsetX,
      y: clamped.clampedOffsetY,
    });
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }
  };

  // Reset crop and zoom
  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Crop and Apply via HTML5 Canvas
  const handleApplyCrop = async () => {
    if (loading) return;

    if (
      !imgRef.current ||
      !naturalDims.width ||
      !naturalDims.height ||
      typeof document === "undefined"
    ) {
      await onApply(file);
      return;
    }

    try {
      const { sx, sy, sWidth, sHeight } = cropInfo;

      // High-resolution canvas render (1280px wide)
      const targetWidth = Math.min(
        1440,
        Math.max(800, naturalDims.width, viewportDims.width * 2),
      );
      const targetHeight = Math.round(
        targetWidth * (viewportDims.height / viewportDims.width),
      );

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        await onApply(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(
        imgRef.current,
        sx,
        sy,
        sWidth,
        sHeight,
        0,
        0,
        targetWidth,
        targetHeight,
      );

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            await onApply(file);
            return;
          }
          const baseName = (file.name || "wallpaper").replace(/\.[^.]+$/, "");
          const croppedFile = new File([blob], `${baseName}-wallpaper.jpg`, {
            type: "image/jpeg",
          });
          await onApply(croppedFile);
        },
        "image/jpeg",
        0.92,
      );
    } catch {
      // Fallback to original file on any unexpected error
      await onApply(file);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-sibs-border bg-slate-50 p-3.5 sm:p-4 font-jakarta">
      {/* Viewport Frame */}
      <div
        ref={viewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative h-56 sm:h-64 w-full select-none touch-none overflow-hidden rounded-xl border-2 border-dashed border-sibs-navy/30 bg-slate-950 shadow-inner cursor-grab active:cursor-grabbing"
      >
        {imageSrc ? (
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Adjust wallpaper"
            onLoad={handleImageLoad}
            draggable={false}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: `${cropInfo.renderedWidth || viewportDims.width}px`,
              height: `${cropInfo.renderedHeight || viewportDims.height}px`,
              transform: `translate(calc(-50% + ${cropInfo.clampedOffsetX}px), calc(-50% + ${cropInfo.clampedOffsetY}px))`,
              maxWidth: "none",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        ) : null}

        {/* Framing rule-of-thirds grid */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-25">
          <div className="border-r border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-r border-white" />
          <div className="border-r border-white" />
          <div />
        </div>

        {/* Drag badge helper */}
        <div className="pointer-events-none absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs">
          <Move size={12} className="text-sibs-orange" />
          <span>Drag & Reposition</span>
        </div>

        {/* Zoom badge indicator */}
        <div className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white/90 backdrop-blur-xs">
          {zoom.toFixed(1)}x
        </div>
      </div>

      {/* Adjust Controls: Zoom & Reset */}
      <div className="flex items-center gap-2.5 px-1">
        <button
          type="button"
          disabled={loading || zoom <= 1}
          onClick={() => handleZoomChange(zoom - 0.2)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-sibs-border bg-white text-sibs-muted hover:border-slate-300 hover:text-sibs-navy transition disabled:opacity-40"
          title="Zoom out"
        >
          <ZoomOut size={14} />
        </button>

        <input
          type="range"
          min="1"
          max="3"
          step="0.05"
          value={zoom}
          disabled={loading}
          onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer rounded-lg bg-slate-200 accent-sibs-navy"
          title="Adjust zoom level"
        />

        <button
          type="button"
          disabled={loading || zoom >= 3}
          onClick={() => handleZoomChange(zoom + 0.2)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-sibs-border bg-white text-sibs-muted hover:border-slate-300 hover:text-sibs-navy transition disabled:opacity-40"
          title="Zoom in"
        >
          <ZoomIn size={14} />
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={handleReset}
          className="inline-flex items-center gap-1 rounded-lg border border-sibs-border bg-white px-2.5 py-1 text-[11px] font-bold text-sibs-muted hover:border-slate-300 hover:text-sibs-navy transition"
          title="Reset to center"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </div>

      {/* File Details & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sibs-border/60 pt-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-sibs-navy">
            {file.name}
          </p>
          <p className="text-[10px] text-sibs-muted">
            {(file.size / 1024 / 1024).toFixed(2)} MB · Drag to frame, zoom to crop
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-lg border border-sibs-border bg-white px-3 py-1.5 text-xs font-bold text-sibs-muted hover:border-slate-300 hover:text-sibs-navy transition"
          >
            Choose Different
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleApplyCrop()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sibs-navy px-4 py-1.5 text-xs font-bold text-white hover:bg-sibs-navy/90 transition disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <UploadCloud size={14} />
            )}
            Apply Wallpaper
          </button>
        </div>
      </div>
    </div>
  );
}
