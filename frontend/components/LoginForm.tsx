"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import CameraCaptureModal from "./CameraCaptureModal";
import ImageCropperModal from "./ImageCropperModal";

export default function LoginForm() {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cropperRawSrc, setCropperRawSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCropperRawSrc(URL.createObjectURL(file));
      setIsCropperOpen(true);
      setError(null);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (role === "teacher") {
        const res = await fetch("/api/auth/teacher/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Invalid username or password.");
        }

        window.location.href = "/teacher/dashboard";
      } else {
        // Student Face-Only Login
        if (!selectedFile) {
          throw new Error("Please select or capture your face photo to authenticate.");
        }

        const formData = new FormData();
        formData.append("photo", selectedFile);

        const res = await fetch("/api/auth/student/login", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Face authentication service error.");
        }

        if (data.matched) {
          window.location.href = "/student/dashboard";
        } else {
          throw new Error(data.message || "Face not recognized. Please register first.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-surface p-space-xl rounded-2xl border border-outline-variant/30 shadow-xl">
      <div className="flex flex-col items-center gap-space-sm mb-space-lg text-center">
        <img
          alt="AttendX Logo"
          className="h-12 w-auto object-contain mb-space-xs"
          src="/images/logo.svg"
        />
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
          Welcome Back
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Sign in to access your AttendX Portal
        </p>
      </div>

      {/* Role Toggle Selector */}
      <div className="grid grid-cols-2 p-1 bg-surface-container-high rounded-xl mb-space-lg border border-outline-variant/20">
        <button
          type="button"
          onClick={() => {
            setRole("student");
            setError(null);
          }}
          className={`py-space-sm text-body-md font-semibold rounded-lg transition-all ${
            role === "student"
              ? "bg-surface text-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Student (Face ID)
        </button>
        <button
          type="button"
          onClick={() => {
            setRole("teacher");
            setError(null);
          }}
          className={`py-space-sm text-body-md font-semibold rounded-lg transition-all ${
            role === "teacher"
              ? "bg-surface text-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Faculty / Teacher
        </button>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="mb-space-md p-3 rounded-xl bg-error-container text-error text-body-sm flex items-center justify-between border border-error/20">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="underline font-bold ml-2">
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
        {role === "teacher" ? (
          <>
            <div>
              <label className="block text-label-md font-semibold text-on-surface mb-space-xs">
                Faculty Username / Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="faculty@university.edu"
                className="w-full px-space-md py-space-sm bg-surface-container-low border border-outline-variant/40 rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-space-xs">
                <label className="block text-label-md font-semibold text-on-surface">
                  Password
                </label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-space-md py-space-sm bg-surface-container-low border border-outline-variant/40 rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                required
              />
            </div>
          </>
        ) : (
          /* Student Face-Only Login UI */
          <div className="flex flex-col gap-space-md">
            <div className="p-space-md bg-surface-container-low border border-outline-variant/30 rounded-xl flex flex-col items-center gap-space-sm text-center">
              <div className="relative w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/40 overflow-hidden flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Face Scan" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[48px] text-primary">
                    face
                  </span>
                )}
              </div>
              <div>
                <span className="block text-label-md font-bold text-on-surface">
                  Facial Biometric Login
                </span>
                <span className="text-label-sm text-on-surface-variant">
                  {selectedFile ? selectedFile.name : "Select or capture your face photo to authenticate"}
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-space-md py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold rounded-lg transition-all text-label-sm flex items-center gap-1 border border-outline-variant/30"
                >
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-space-md py-1.5 bg-primary-container/40 hover:bg-primary-container/70 text-primary font-semibold rounded-lg transition-all text-label-sm flex items-center gap-1 border border-primary/30"
                >
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  <span>Use Camera</span>
                </button>
              </div>
            </div>

            <CameraCaptureModal
              isOpen={isCameraOpen}
              onClose={() => setIsCameraOpen(false)}
              onCapture={(file) => {
                setCropperRawSrc(URL.createObjectURL(file));
                setIsCropperOpen(true);
                setError(null);
              }}
              title="Face Login — Live Camera Capture"
            />

            <ImageCropperModal
              isOpen={isCropperOpen}
              imageSrc={cropperRawSrc}
              onClose={() => setIsCropperOpen(false)}
              onCropComplete={(croppedFile, croppedUrl) => {
                setSelectedFile(croppedFile);
                setPreviewUrl(croppedUrl);
              }}
              title="Student Face Login — Frame Face Photo"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-space-md text-body-lg font-bold text-on-primary bg-primary hover:bg-primary/90 rounded-xl shadow-lg transition-all mt-space-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span>Authenticating...</span>
          ) : (
            <span>Sign In as {role === "student" ? "Student (Face ID)" : "Faculty"}</span>
          )}
        </button>
      </form>

      <div className="mt-space-lg text-center text-body-md text-on-surface-variant">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Create Account
        </Link>
      </div>
    </div>
  );
}

