"use client";

import { useState, useRef, useEffect } from "react";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title?: string;
}

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  title = "Take Photo with Live Camera",
}: CameraCaptureModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Start camera when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      resetState();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setIsStarting(true);
      setCameraError(null);
      setCapturedBlob(null);
      setCapturedPreview(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Live camera is not supported in this browser environment.");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings or use file upload.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera device found on this system. Please use file upload.");
      } else {
        setCameraError(err.message || "Failed to start live camera preview.");
      }
    } finally {
      setIsStarting(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const resetState = () => {
    setCapturedBlob(null);
    setCapturedPreview(null);
    setCameraError(null);
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          const preview = URL.createObjectURL(blob);
          setCapturedPreview(preview);
        }
      },
      "image/jpeg",
      0.95
    );
  };

  const handleRetake = () => {
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
    }
    setCapturedBlob(null);
    setCapturedPreview(null);
  };

  const handleConfirm = () => {
    if (!capturedBlob) return;

    const file = new File([capturedBlob], `camera_capture_${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    onCapture(file);
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-surface border border-outline-variant/40 w-full max-w-xl rounded-2xl shadow-2xl p-space-lg flex flex-col gap-space-md relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-xs">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[24px] text-primary">videocam</span>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Camera error message */}
        {cameraError ? (
          <div className="p-space-md bg-error-container text-error rounded-xl flex flex-col gap-space-xs text-body-sm">
            <div className="flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-[20px]">videocam_off</span>
              <span>Camera Error</span>
            </div>
            <p>{cameraError}</p>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="px-space-md py-1.5 bg-surface text-on-surface font-semibold rounded-lg text-label-sm shadow-sm"
              >
                Use File Upload Instead
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-space-md">
            {/* Viewport Area */}
            <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden flex items-center justify-center border border-outline-variant/30 shadow-inner">
              {capturedPreview ? (
                /* Still Frame Preview */
                <img
                  src={capturedPreview}
                  alt="Captured Frame Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                /* Live Stream Video */
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el && stream) {
                      el.srcObject = stream;
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {/* Status overlay */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white font-label-sm text-xs flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    capturedPreview ? "bg-amber-400" : "bg-emerald-400 animate-pulse"
                  }`}
                />
                <span>{capturedPreview ? "Photo Captured — Confirm Below" : "Live Camera Feed"}</span>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-space-sm pt-space-xs">
              {capturedPreview ? (
                <>
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="px-space-md py-space-sm bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold rounded-xl transition-all text-body-sm flex items-center gap-1.5 border border-outline-variant/30"
                  >
                    <span className="material-symbols-outlined text-[18px]">replay</span>
                    <span>Retake Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="px-space-lg py-space-sm bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>Confirm &amp; Use Photo</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      onClose();
                    }}
                    className="px-space-md py-space-sm bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold rounded-xl transition-all text-body-sm border border-outline-variant/30"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleCaptureFrame}
                    disabled={isStarting || !stream}
                    className="px-space-lg py-space-sm bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                    <span>Capture Still Photo</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
