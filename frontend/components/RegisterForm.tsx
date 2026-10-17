"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import CameraCaptureModal from "./CameraCaptureModal";
import ImageCropperModal from "./ImageCropperModal";
import AttendXLogo from "@/components/AttendXLogo";

export default function RegisterForm() {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [dept, setDept] = useState("");
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
      // Reset input value so re-selecting same file triggers change event
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (role === "teacher") {
        const username = email || name.toLowerCase().replace(/\s+/g, "");

        // Step 1: Register Teacher
        const regRes = await fetch("/api/auth/teacher/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, name }),
        });

        const regData = await regRes.json();
        if (!regRes.ok) {
          throw new Error(regData.error || "Teacher registration failed.");
        }

        // Step 2: Auto Login Teacher to establish session cookie
        const loginRes = await fetch("/api/auth/teacher/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok || !loginData.success) {
          throw new Error(loginData.error || "Auto login failed after registration.");
        }

        window.location.href = "/teacher/dashboard";
      } else {
        // Student Registration
        if (!selectedFile) {
          throw new Error("Facial biometric photo is required to register a student.");
        }

        const formData = new FormData();
        formData.append("name", name);
        formData.append("photo", selectedFile);

        const regRes = await fetch("/api/students", {
          method: "POST",
          body: formData,
        });

        const regData = await regRes.json();
        if (!regRes.ok) {
          throw new Error(regData.error || "Student face registration failed.");
        }

        // Auto login student if photo was provided
        if (selectedFile) {
          const loginFormData = new FormData();
          loginFormData.append("photo", selectedFile);

          const loginRes = await fetch("/api/auth/student/login", {
            method: "POST",
            body: loginFormData,
          });

          const loginData = await loginRes.json();
          if (loginRes.ok && loginData.matched) {
            window.location.href = "/student/dashboard";
            return;
          }
        }

        // If no photo or auto-match skipped, redirect to login page for face login
        window.location.href = "/login";
      }
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl bg-surface p-space-xl rounded-2xl border border-outline-variant/30 shadow-xl my-8">
      <div className="flex flex-col items-center gap-space-sm mb-space-lg text-center">
        <AttendXLogo size={48} className="mb-space-xs" />
        <h1 className="font-display text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
          Create Account
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Register for your AttendX Biometric Portal
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
          Student Registration
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
          Faculty Registration
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
        <div>
          <label className="block text-label-md font-semibold text-on-surface mb-space-xs">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={role === "student" ? "e.g. Alex Morgan" : "e.g. Dr. Aris Thorne"}
            className="w-full px-space-md py-space-sm bg-surface-container-low border border-outline-variant/40 rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            required
          />
        </div>

        {role === "teacher" && (
          <>
            <div>
              <label className="block text-label-md font-semibold text-on-surface mb-space-xs">
                Faculty Email / Username
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="faculty@university.edu"
                className="w-full px-space-md py-space-sm bg-surface-container-low border border-outline-variant/40 rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-label-md font-semibold text-on-surface mb-space-xs">
                Department / Specialization
              </label>
              <input
                type="text"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                placeholder="e.g. Department of Computer Science"
                className="w-full px-space-md py-space-sm bg-surface-container-low border border-outline-variant/40 rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-label-md font-semibold text-on-surface mb-space-xs">
                Password
              </label>
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
        )}

        {role === "student" && (
          <>
            <div>
              <label className="block text-label-md font-semibold text-on-surface mb-space-xs">
                Student Registration Roll No. / ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. CS-2024-8891"
                className="w-full px-space-md py-space-sm bg-surface-container-low border border-outline-variant/40 rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Biometric Scan Registration Box */}
            <div className="p-space-md bg-surface-container-high/50 border border-outline-variant/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-md">
                <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center text-primary shrink-0">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Face Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[24px]">
                      face
                    </span>
                  )}
                </div>
                <div>
                  <span className="block text-label-md font-semibold text-on-surface">
                    Facial Biometric Enrollment
                  </span>
                  <span className="text-label-sm text-on-surface-variant">
                    {selectedFile ? selectedFile.name : "Select or capture face photo to register"}
                  </span>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-label-sm font-semibold text-on-surface bg-surface-container-high hover:bg-surface-container-highest px-3 py-1.5 rounded-xl transition-all border border-outline-variant/30 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  <span>Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="text-label-sm font-semibold text-primary bg-primary-container/40 hover:bg-primary-container/70 px-3 py-1.5 rounded-xl transition-all border border-primary/30 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                  <span>Take Photo</span>
                </button>
              </div>
            </div>

            {/* Live Camera Modal */}
            <CameraCaptureModal
              isOpen={isCameraOpen}
              onClose={() => setIsCameraOpen(false)}
              onCapture={(file) => {
                setCropperRawSrc(URL.createObjectURL(file));
                setIsCropperOpen(true);
                setError(null);
              }}
              title="Student Registration — Live Camera"
            />

            {/* Interactive Image Cropper Modal */}
            <ImageCropperModal
              isOpen={isCropperOpen}
              imageSrc={cropperRawSrc}
              onClose={() => setIsCropperOpen(false)}
              onCropComplete={(croppedFile, croppedUrl) => {
                setSelectedFile(croppedFile);
                setPreviewUrl(croppedUrl);
              }}
              title="Student Registration — Frame Face Photo"
            />
          </>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-space-md text-body-lg font-bold text-on-primary bg-primary hover:bg-primary/90 rounded-xl shadow-lg transition-all mt-space-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span>Processing Registration...</span>
          ) : (
            <span>Create {role === "student" ? "Student" : "Faculty"} Account</span>
          )}
        </button>
      </form>

      <div className="mt-space-lg text-center text-body-md text-on-surface-variant">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}

