"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import CameraCaptureModal from "./CameraCaptureModal";

interface Subject {
  subject_id: string;
  subject_code: string;
  name: string;
  section: string;
  teacher_id: string;
}

interface AttendanceLog {
  log_id: string;
  student_id: string;
  subject_id: string;
  timestamp: string;
  is_present: boolean;
  method: "face" | "qr";
  created_at: string;
  student_name?: string;
  subject_name?: string;
}

interface ReviewStudent {
  student_id: string;
  name: string;
  is_present: boolean;
}

export default function AttendanceClient() {
  const [mode, setMode] = useState<"facial" | "qr">("facial");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Review & Override state
  const [reviewStudents, setReviewStudents] = useState<ReviewStudent[] | null>(null);
  const [reviewMeta, setReviewMeta] = useState<{ detections_count: number; matched_count: number; mock: boolean } | null>(null);
  const [isSavingReview, setIsSavingReview] = useState(false);

  // States
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResult, setApiResult] = useState<any | null>(null);
  const [recentLogs, setRecentLogs] = useState<AttendanceLog[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch subjects on mount
  useEffect(() => {
    async function loadSubjects() {
      try {
        setLoadingSubjects(true);
        const res = await fetch("/api/subjects");
        if (!res.ok) throw new Error("Failed to load subjects");
        const data = await res.json();
        const list = data.subjects || [];
        setSubjects(list);
        if (list.length > 0) {
          setSelectedSubjectId(list[0].subject_id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load subjects.");
      } finally {
        setLoadingSubjects(false);
      }
    }
    loadSubjects();
  }, []);

  // 2. Fetch logs & QR when selectedSubjectId changes
  const fetchSubjectLogs = async (subjectId: string) => {
    if (!subjectId) return;
    try {
      const res = await fetch(`/api/attendance/logs?subject_id=${subjectId}`);
      if (res.ok) {
        const data = await res.json();
        setRecentLogs(data.logs || []);
      }
    } catch {
      // Ignore background refresh errors
    }
  };

  const fetchSubjectQr = async (subjectId: string) => {
    if (!subjectId) return;
    try {
      const res = await fetch(`/api/subjects/${subjectId}/qr`);
      if (res.ok) {
        const data = await res.json();
        setQrDataUrl(data.qr_code || null);
      }
    } catch {
      setQrDataUrl(null);
    }
  };

  useEffect(() => {
    if (selectedSubjectId) {
      fetchSubjectLogs(selectedSubjectId);
      if (mode === "qr") {
        fetchSubjectQr(selectedSubjectId);
      }
    }
  }, [selectedSubjectId, mode]);

  // Handle image selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setApiResult(null);
      setReviewStudents(null);
      setReviewMeta(null);
      setError(null);
    }
  };

  // Step 1: Submit photo to POST /api/attendance/take for AI detection review
  const handleSubmitAttendance = async () => {
    if (!selectedSubjectId) {
      setError("Please select a subject first.");
      return;
    }

    if (!selectedFile) {
      setError("Please select or upload a classroom photo first.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setApiResult(null);
      setReviewStudents(null);
      setReviewMeta(null);

      const formData = new FormData();
      formData.append("subject_id", selectedSubjectId);
      formData.append("photo", selectedFile);

      const res = await fetch("/api/attendance/take", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Attendance processing failed.");
      }

      const result = await res.json();
      setApiResult(result);

      if (result.preview && result.students) {
        setReviewStudents(result.students);
        setReviewMeta({
          detections_count: result.detections_count || 0,
          matched_count: result.matched_count || 0,
          mock: result.mock || false,
        });
      }
    } catch (err: any) {
      setError(err.message || "Attendance submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle student status (Present <-> Absent) in review state
  const toggleStudentStatus = (studentId: string) => {
    if (!reviewStudents) return;
    setReviewStudents(
      reviewStudents.map((s) =>
        s.student_id === studentId ? { ...s, is_present: !s.is_present } : s
      )
    );
  };

  // Step 2: Confirm & Save reviewed attendance to DB
  const handleConfirmAndSave = async () => {
    if (!selectedSubjectId || !reviewStudents) return;

    try {
      setIsSavingReview(true);
      setError(null);

      const res = await fetch("/api/attendance/take", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirm: true,
          subject_id: selectedSubjectId,
          reviewed_students: reviewStudents,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Saving attendance failed.");
      }

      const confirmResult = await res.json();
      setApiResult(confirmResult);
      setReviewStudents(null);
      setReviewMeta(null);

      // Re-fetch attendance logs from backend API to update UI state with saved database state
      fetchSubjectLogs(selectedSubjectId);
    } catch (err: any) {
      setError(err.message || "Saving reviewed attendance failed.");
    } finally {
      setIsSavingReview(false);
    }
  };

  // Discard review action without saving to DB
  const handleDiscard = () => {
    setReviewStudents(null);
    setReviewMeta(null);
    setApiResult(null);
  };

  const selectedSubject = subjects.find((s) => s.subject_id === selectedSubjectId);

  return (
    <div className="p-space-lg md:p-space-xl max-w-[1600px] mx-auto">
      {/* Top Title, Subject Select & Mode Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-xl">
        <div className="flex flex-col gap-1 min-w-0 max-w-full">
          <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">
            Take Attendance
          </h1>
          {loadingSubjects ? (
            <span className="text-body-md text-outline animate-pulse">Loading subjects...</span>
          ) : subjects.length === 0 ? (
            <span className="text-body-md text-error">
              No subjects found. Please{" "}
              <Link href="/teacher/subjects" className="underline font-bold">
                create a subject
              </Link>{" "}
              first.
            </span>
          ) : (
            <div className="flex items-center gap-2 min-w-0 max-w-full">
              <label className="text-body-md text-on-surface-variant font-semibold shrink-0">Course:</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  handleDiscard();
                }}
                className="h-10 px-3 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface font-headline-sm text-sm font-bold focus:outline-none cursor-pointer max-w-full min-w-0 truncate"
              >
                {subjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.subject_code} — {s.name} ({s.section})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex items-center gap-1 p-1 bg-surface-container-high rounded-xl border border-outline-variant/30">
          <button
            type="button"
            onClick={() => setMode("facial")}
            className={`flex items-center gap-space-xs px-space-md py-space-sm rounded-lg text-body-md font-semibold transition-all ${
              mode === "facial"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">center_focus_strong</span>
            <span>AI Facial Recognition</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("qr")}
            className={`flex items-center gap-space-xs px-space-md py-space-sm rounded-lg text-body-md font-semibold transition-all ${
              mode === "qr"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            <span>Subject Join QR</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-space-lg p-4 rounded-xl bg-error-container text-error font-body-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline font-semibold ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Mode View */}
      {mode === "facial" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
          {/* Camera / Image Upload Viewport Area */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-space-md flex flex-col shadow-sm">
            <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden flex items-center justify-center border border-outline-variant/20">
              <img
                alt="Classroom Feed"
                src={previewUrl || "/images/classroom.svg"}
                className={`w-full h-full ${previewUrl ? "object-contain" : "object-cover"}`}
              />
              <div className="absolute inset-0 border-2 border-primary/40 rounded-xl pointer-events-none" />

              {/* Status Overlay Indicator */}
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-space-md py-space-xs rounded-full flex items-center gap-space-xs text-white text-label-md">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isSubmitting
                      ? "bg-amber-400 animate-ping"
                      : reviewStudents
                      ? "bg-blue-400 animate-pulse"
                      : "bg-emerald-400 animate-pulse"
                  }`}
                />
                {isSubmitting
                  ? "Processing Face Detection & Matching..."
                  : reviewStudents
                  ? "Review & Override Mode — Ready to Confirm"
                  : selectedFile
                  ? `Selected: ${selectedFile.name}`
                  : "Upload classroom photo to process attendance"}
              </div>
            </div>

            {/* Notification State Banners */}
            {apiResult && !reviewStudents && (
              <div className="mt-4 p-4 rounded-xl border flex flex-col gap-1">
                {apiResult.detections_count === 0 ? (
                  /* No Face Detected UI */
                  <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-body-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-amber-600">warning</span>
                    <span><strong>No Face Detected:</strong> No human faces found in uploaded photo.</span>
                  </div>
                ) : apiResult.logs && apiResult.logs.length > 0 ? (
                  /* Recognized Face Saved UI */
                  <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-body-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
                    <span>
                      <strong>Saved &amp; Recorded:</strong> Permanently saved {apiResult.matched_count} attendance record(s) in database!
                    </span>
                  </div>
                ) : (
                  /* Unrecognized / Discarded Banner */
                  <div className="p-3 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-body-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-blue-600">info</span>
                    <span>{apiResult.message || "Attendance review complete."}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-space-md pt-space-sm border-t border-outline-variant/20 flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-space-md py-space-sm bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold rounded-xl transition-all text-body-sm flex items-center gap-2 border border-outline-variant/30"
                >
                  <span className="material-symbols-outlined text-[20px]">upload_file</span>
                  <span>Upload Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-space-md py-space-sm bg-primary-container/40 hover:bg-primary-container/70 text-primary font-semibold rounded-xl transition-all text-body-sm flex items-center gap-2 border border-primary/30"
                >
                  <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                  <span>Use Camera</span>
                </button>
              </div>

              <button
                onClick={handleSubmitAttendance}
                disabled={isSubmitting || !selectedFile || !selectedSubjectId}
                className="px-space-lg py-space-sm bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">center_focus_strong</span>
                <span>{isSubmitting ? "Processing..." : "Process Attendance Now"}</span>
              </button>
            </div>

            <CameraCaptureModal
              isOpen={isCameraOpen}
              onClose={() => setIsCameraOpen(false)}
              onCapture={(file) => {
                setSelectedFile(file);
                setPreviewUrl(URL.createObjectURL(file));
                setApiResult(null);
                setReviewStudents(null);
                setReviewMeta(null);
                setError(null);
              }}
              title="Classroom Photo — Live Camera Capture"
            />
          </div>

          {/* Right Panel: Attendance Review Roster OR Saved Attendance Logs */}
          <div className="bg-surface p-space-lg rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
            {reviewStudents ? (
              /* Review & Override Panel */
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-md pb-space-xs border-b border-outline-variant/20">
                    <div>
                      <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        Manual Review
                      </h2>
                      <span className="text-label-sm text-on-surface-variant block">
                        Toggle status before saving
                      </span>
                    </div>
                    <span className="px-space-sm py-1 bg-amber-100 text-amber-900 text-label-sm font-bold rounded-full border border-amber-300">
                      Review State
                    </span>
                  </div>

                  {reviewMeta && (
                    <div className="mb-3 p-2.5 bg-surface-container-low rounded-lg text-label-sm text-on-surface-variant flex items-center justify-between">
                      <span>Detected: <strong>{reviewMeta.detections_count} face(s)</strong></span>
                      <span>AI Matched: <strong>{reviewMeta.matched_count} present</strong></span>
                    </div>
                  )}

                  <div className="flex flex-col gap-space-sm max-h-[380px] overflow-y-auto pr-1">
                    {reviewStudents.length === 0 ? (
                      <div className="p-6 text-center text-outline text-body-sm">
                        No students enrolled in roster.
                      </div>
                    ) : (
                      reviewStudents.map((s) => (
                        <div
                          key={s.student_id}
                          className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-xl border border-outline-variant/20"
                        >
                          <div className="flex items-center gap-space-sm">
                            <img
                              alt={s.name}
                              src="/images/avatar.svg"
                              className="h-9 w-9 rounded-full object-cover"
                            />
                            <div>
                              <span className="block text-label-md font-semibold text-on-surface">
                                {s.name}
                              </span>
                              <span className="text-label-sm text-on-surface-variant font-mono">
                                ID: {s.student_id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>

                          {/* Present / Absent Toggle Button */}
                          <button
                            type="button"
                            onClick={() => toggleStudentStatus(s.student_id)}
                            className={`px-3 py-1 rounded-full text-label-sm font-bold flex items-center gap-1 transition-all ${
                              s.is_present
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                                : "bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {s.is_present ? "check_circle" : "cancel"}
                            </span>
                            <span>{s.is_present ? "Present" : "Absent"}</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Confirm & Save / Discard Actions */}
                <div className="mt-space-md pt-space-md border-t border-outline-variant/20 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmAndSave}
                    disabled={isSavingReview}
                    className="w-full py-space-sm bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">save</span>
                    <span>{isSavingReview ? "Saving..." : "Confirm & Save Attendance"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscard}
                    disabled={isSavingReview}
                    className="w-full py-space-sm bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold rounded-xl transition-all border border-outline-variant/40 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                    <span>Discard (Do Not Save)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Saved Logs Panel */
              <div>
                <div className="flex items-center justify-between mb-space-md pb-space-xs border-b border-outline-variant/20">
                  <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Recorded Logs ({recentLogs.length})
                  </h2>
                  <span className="px-space-sm py-1 bg-emerald-100 text-emerald-800 text-label-sm font-bold rounded-full">
                    Saved State
                  </span>
                </div>

                <div className="flex flex-col gap-space-sm max-h-[420px] overflow-y-auto pr-1">
                  {recentLogs.length === 0 ? (
                    <div className="p-6 text-center text-outline text-body-sm">
                      No attendance logged for this subject yet.
                    </div>
                  ) : (
                    recentLogs.map((log) => (
                      <div
                        key={log.log_id}
                        className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-xl border border-outline-variant/20"
                      >
                        <div className="flex items-center gap-space-sm">
                          <img
                            alt={log.student_name || "Student"}
                            src="/images/avatar.svg"
                            className="h-9 w-9 rounded-full object-cover"
                          />
                          <div>
                            <span className="block text-label-md font-semibold text-on-surface">
                              {log.student_name || `Student ${log.student_id.slice(0, 6)}`}
                            </span>
                            <span className="text-label-sm text-on-surface-variant font-mono">
                              ID: {log.student_id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`block text-label-sm font-bold ${log.is_present !== false ? "text-emerald-600" : "text-rose-600"}`}>
                            {log.is_present !== false ? (log.method === "face" ? "Face ID (Present)" : "QR (Present)") : "Absent"}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-space-md pt-space-xs border-t border-outline-variant/20 text-center">
                  <span className="text-label-sm text-outline">
                    Subject Code: <strong>{selectedSubject?.subject_code || "N/A"}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Static Subject QR Code View */
        <div className="max-w-2xl mx-auto bg-surface p-space-xl rounded-2xl border border-outline-variant/30 shadow-lg flex flex-col items-center text-center">
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-space-xs">
            Static Subject Join QR
          </h2>
          <p className="text-body-md text-on-surface-variant mb-space-lg">
            Students scan this code to enroll in {selectedSubject?.name || "the selected subject"}.
          </p>

          <div className="p-space-lg bg-white rounded-2xl border-4 border-primary/30 shadow-xl mb-space-lg">
            {qrDataUrl ? (
              <img alt="Subject QR Code" src={qrDataUrl} className="w-64 h-64 object-contain" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-outline animate-pulse">
                Loading QR code...
              </div>
            )}
          </div>

          <div className="flex items-center gap-space-md text-body-md text-on-surface bg-surface-container-high px-space-lg py-space-sm rounded-full font-mono">
            <span>Static Join Code: <strong>{selectedSubject?.subject_code || "..."}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
