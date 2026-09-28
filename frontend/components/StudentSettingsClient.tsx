"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import CameraCaptureModal from "./CameraCaptureModal";
import ImageCropperModal from "./ImageCropperModal";

interface StudentUser {
  id: string;
  name: string;
  role: string;
  created_at?: string;
}

export default function StudentSettingsClient() {
  const router = useRouter();
  const [user, setUser] = useState<StudentUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Face Re-registration state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingFace, setIsUploadingFace] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [cropperRawSrc, setCropperRawSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          setErrorMsg("Unauthenticated session. Please log in.");
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (!data.authenticated || !data.user || data.user.role !== "student") {
          setErrorMsg("Unauthorized student access.");
          setLoading(false);
          return;
        }

        setUser(data.user);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load student profile.");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCropperRawSrc(URL.createObjectURL(file));
      setIsCropperOpen(true);
      setErrorMsg(null);
      e.target.value = "";
    }
  };

  const handleReRegisterFace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !user?.id) {
      setErrorMsg("Please select a new face photo first.");
      return;
    }

    try {
      setIsUploadingFace(true);
      setErrorMsg(null);

      const formData = new FormData();
      formData.append("photo", selectedFile);

      const res = await fetch(`/api/students/${user.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update face vector.");
      }

      const data = await res.json();
      setSelectedFile(null);
      setPreviewUrl(null);
      showToast("Facial biometric profile successfully re-registered and updated in database!");
    } catch (err: any) {
      setErrorMsg(err.message || "Face re-registration failed.");
    } finally {
      setIsUploadingFace(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/login");
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="w-full pt-16 bg-surface min-h-screen">
      <div className="flex flex-col w-full">
        {/* Subheader */}
        <div className="sticky top-16 z-30 bg-surface/90 backdrop-blur-md px-gutter py-space-sm flex flex-col md:flex-row md:items-center justify-between gap-space-sm shadow-sm">
          <div className="flex items-center gap-space-xs text-body-sm font-body-sm text-outline">
            <span className="hover:text-primary transition-colors cursor-pointer">Academics</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Account</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface font-label-md">Profile &amp; Settings</span>
          </div>

          <nav className="flex items-center gap-space-xs overflow-x-auto py-1">
            <a
              className="px-space-md py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-label-md transition-all shadow-sm hover:opacity-90 flex items-center gap-1.5"
              href="#section-profile"
            >
              <span className="material-symbols-outlined text-[16px]">account_circle</span>
              <span>Profile</span>
            </a>
            <a
              className="px-space-md py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high font-label-md text-label-md transition-all flex items-center gap-1.5"
              href="#section-biometrics"
            >
              <span className="material-symbols-outlined text-[16px]">fingerprint</span>
              <span>Face Biometrics</span>
            </a>
            <button
              onClick={handleLogout}
              className="px-space-md py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:text-error hover:bg-error-container font-label-md text-label-md transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Sign Out</span>
            </button>
          </nav>
        </div>

        <div className="px-margin-desktop py-space-xl max-w-[1480px] mx-auto w-full flex flex-col gap-space-xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                  Student Portal
                </span>
                <span className="flex items-center gap-1 text-secondary font-label-sm text-label-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  Biometric Profile Active
                </span>
              </div>
              <h1 className="font-display-md text-display-md text-on-surface tracking-tight font-bold">
                Account Settings &amp; Biometrics
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl mt-1">
                View your credentials, manage your 128-d AI face profile, and update biometric registration.
              </p>
            </div>

            <div className="flex items-center gap-space-sm bg-surface-container-lowest p-space-sm rounded-xl shadow-sm self-start md:self-auto">
              <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[24px]">verified_user</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">FERPA Guard</span>
                <span className="font-label-md text-label-md text-on-surface">Verified Student Profile</span>
              </div>
            </div>
          </div>

          {/* Toast Banner */}
          {toastMsg && (
            <div className="p-space-md rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
                <span className="font-body-sm text-body-sm font-semibold">{toastMsg}</span>
              </div>
              <button onClick={() => setToastMsg(null)} className="underline font-bold text-emerald-800">
                Dismiss
              </button>
            </div>
          )}

          {/* Loading Banner */}
          {loading && (
            <div className="p-space-lg rounded-xl bg-surface-container-low flex items-center justify-center gap-space-sm text-primary">
              <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
              <span className="font-label-lg text-label-lg font-semibold">Loading student profile...</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-space-md rounded-xl bg-error-container text-on-error-container flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span className="font-body-sm text-body-sm flex-1">{errorMsg}</span>
            </div>
          )}

          {/* Profile Section */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-desktop items-start">
            <div className="xl:col-span-7 flex flex-col gap-space-xl">
              <section
                className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-lg"
                id="section-profile"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-9 h-9 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </div>
                    <div>
                      <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                        Student Profile Information
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Identity details synced with campus registrar records
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low text-primary font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-[14px]">sync</span> Verified Record
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-space-md p-space-md bg-surface-container-low rounded-xl">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-2xl shadow-sm">
                      {(user?.name || "S").slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-start text-center sm:text-left flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-space-xs">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        {user?.name || "Student"}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-secondary font-label-sm text-label-sm font-semibold">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        Student Biometric Verified
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-outline-variant mt-0.5">
                      Enrolled Student
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-on-surface font-semibold">
                      Full Student Name
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-outline">
                        badge
                      </span>
                      <input
                        readOnly
                        className="w-full bg-surface-container-low pl-10 pr-3 py-2.5 rounded-xl font-body-md text-body-md text-on-surface focus:outline-none"
                        type="text"
                        value={user?.name || ""}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-on-surface font-semibold">
                      Student ID / Roll No
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-outline">
                        numbers
                      </span>
                      <input
                        disabled
                        className="w-full bg-surface-container-high/60 text-on-surface-variant/80 pl-10 pr-10 py-2.5 rounded-xl font-body-md text-body-md font-mono text-xs cursor-not-allowed select-none"
                        type="text"
                        value={user?.id || ""}
                      />
                      <span
                        className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline"
                        title="Locked by administration"
                      >
                        lock
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Biometrics Status & Re-Registration Section */}
              <section
                className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-lg"
                id="section-biometrics"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-9 h-9 rounded-xl bg-secondary text-on-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">document_scanner</span>
                    </div>
                    <div>
                      <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                        Facial Biometric Re-registration
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Update your registered 128-d face vector in Supabase database
                      </p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                    Active 128-d Model
                  </div>
                </div>

                <form onSubmit={handleReRegisterFace} className="flex flex-col gap-space-md">
                  <div className="p-space-md bg-surface-container-low border border-outline-variant/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                    <div className="flex items-center gap-space-md">
                      <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/30 overflow-hidden flex items-center justify-center text-primary shrink-0">
                        {previewUrl ? (
                          <img src={previewUrl} alt="Face Preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-[28px]">face</span>
                        )}
                      </div>
                      <div>
                        <span className="block text-label-md font-bold text-on-surface">
                          Update Facial Image
                        </span>
                        <span className="text-body-sm text-on-surface-variant">
                          {selectedFile ? selectedFile.name : "Select or capture face photo to overwrite vector"}
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
                        className="px-space-md py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold rounded-xl transition-all text-body-sm border border-outline-variant/30 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                        <span>Upload File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="px-space-md py-2 bg-primary-container/40 hover:bg-primary-container/70 text-primary font-semibold rounded-xl transition-all text-body-sm border border-primary/30 flex items-center gap-1"
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
                      setErrorMsg(null);
                    }}
                    title="Student Re-registration — Live Camera"
                  />

                  <ImageCropperModal
                    isOpen={isCropperOpen}
                    imageSrc={cropperRawSrc}
                    onClose={() => setIsCropperOpen(false)}
                    onCropComplete={(croppedFile, croppedUrl) => {
                      setSelectedFile(croppedFile);
                      setPreviewUrl(croppedUrl);
                    }}
                    title="Student Re-registration — Frame Face Photo"
                  />

                  <div className="flex items-center justify-end pt-space-xs">
                    <button
                      type="submit"
                      disabled={isUploadingFace || !selectedFile}
                      className="px-space-xl py-2.5 bg-primary text-on-primary font-bold rounded-full shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">center_focus_strong</span>
                      <span>{isUploadingFace ? "Extracting & Overwriting..." : "Overwrite Face Embedding"}</span>
                    </button>
                  </div>
                </form>
              </section>
            </div>

            {/* Right Side Column */}
            <div className="xl:col-span-5 flex flex-col gap-space-xl">
              <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-9 h-9 rounded-xl bg-error-container text-error flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">lock_clock</span>
                  </div>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                      Active Session &amp; Sign Out
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Manage student session access
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-xl">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface">
                      <span className="material-symbols-outlined text-[18px]">laptop_mac</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-label-md text-on-surface truncate font-semibold">
                        Student Session ({user?.name || "Student"})
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[10px] uppercase font-bold shrink-0">
                    Active
                  </span>
                </div>

                <div className="pt-space-xs flex flex-col gap-2">
                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 rounded-full bg-error hover:opacity-90 text-on-error font-label-lg text-label-lg transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 font-bold"
                  >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    <span>Sign Out of AttendX</span>
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
