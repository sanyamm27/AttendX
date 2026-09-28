"use client";

import React, { useState, useCallback } from "react";
import Cropper, { Area, Point } from "react-easy-crop";

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedFile: File, croppedPreviewUrl: string) => void;
  title?: string;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<{ file: File; url: string }> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d canvas context available");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas blob generation failed"));
        return;
      }
      const croppedFile = new File([blob], "cropped_face.jpg", {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      const url = URL.createObjectURL(blob);
      resolve({ file: croppedFile, url });
    }, "image/jpeg", 0.95);
  });
}

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  title = "Crop & Frame Your Face",
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixelsParam: Area) => {
      setCroppedAreaPixels(croppedAreaPixelsParam);
    },
    []
  );

  const handleConfirmCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const { file, url } = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(file, url);
      onClose();
    } catch (err) {
      console.error("Crop error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">crop</span>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative w-full h-[320px] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            showGrid={true}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={handleCropComplete}
          />
        </div>

        {/* Controls Footer */}
        <div className="p-5 flex flex-col gap-4 bg-surface">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">zoom_out</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">zoom_in</span>
          </div>

          <p className="text-label-sm text-on-surface-variant text-center">
            Drag to position face centered inside the grid framing box.
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-label-md font-semibold text-on-surface-variant hover:text-on-surface rounded-xl hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmCrop}
              className="px-5 py-2 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-label-md disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              <span>{isProcessing ? "Cropping..." : "Crop & Confirm"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
