"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import jsQR from "jsqr";

interface StudentUser {
  id: string;
  name: string;
  role: string;
}

interface Subject {
  subject_id: string;
  subject_code: string;
  name: string;
  section: string;
  teacher_id: string;
  created_at: string;
}

export default function StudentJoinClient() {
  const [user, setUser] = useState<StudentUser | null>(null);
  const [activeTab, setActiveTab] = useState<"code" | "qr">("code");
  const [inputCode, setInputCode] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successSubject, setSuccessSubject] = useState<Subject | null>(null);
  const [enrolledSubjects, setEnrolledSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Real QR Camera & Decoding state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraStarting, setCameraStarting] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanSuccessFeedback, setScanSuccessFeedback] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanAnimFrameRef = useRef<number | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // 1. Fetch current session identity & enrolled subjects on mount
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          setErrorMsg("Unauthenticated user session.");
          setLoading(false);
          return;
        }

        const meData = await meRes.json();
        if (!meData.authenticated || !meData.user) {
          setErrorMsg("User session expired. Please log in.");
          setLoading(false);
          return;
        }

        setUser(meData.user);

        // Fetch student's real enrolled subjects
        const subjRes = await fetch(`/api/subjects?student_id=${meData.user.id}`);
        if (subjRes.ok) {
          const sData = await subjRes.json();
          setEnrolledSubjects(sData.subjects || []);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to verify authentication.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const refreshEnrolledSubjects = async (studentId: string) => {
    try {
      const res = await fetch(`/api/subjects?student_id=${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setEnrolledSubjects(data.subjects || []);
      }
    } catch (err) {
      console.error("Failed to refresh enrolled subjects:", err);
    }
  };

  const handleJoinByCode = async (codeToSubmit?: string) => {
    const rawCode = (codeToSubmit || inputCode).trim().toUpperCase();
    if (!rawCode) {
      setErrorMsg("Please enter or scan a valid subject join code.");
      return;
    }

    if (!user || !user.id) {
      setErrorMsg("User authentication required to join a subject.");
      return;
    }

    // Check if student is already enrolled in this subject code
    const alreadyEnrolled = enrolledSubjects.find(
      (s) => s.subject_code.toUpperCase() === rawCode
    );
    if (alreadyEnrolled) {
      setErrorMsg(
        `Already Enrolled: You are already enrolled in ${alreadyEnrolled.subject_code} (${alreadyEnrolled.name}).`
      );
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      // Query available subjects to find subject_id by subject_code if needed
      let targetSubjectId = "bycode";
      const allSubjRes = await fetch("/api/subjects");
      if (allSubjRes.ok) {
        const allData = await allSubjRes.json();
        const found = (allData.subjects || []).find(
          (s: Subject) => s.subject_code.toUpperCase() === rawCode
        );
        if (found) {
          targetSubjectId = found.subject_id;
        }
      }

      // Call verified join API: POST /api/subjects/[id]/join
      const joinRes = await fetch(`/api/subjects/${targetSubjectId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: user.id,
          subject_code: rawCode,
        }),
      });

      const joinData = await joinRes.json();

      if (!joinRes.ok || !joinData.success) {
        if (joinRes.status === 404 || joinData.error?.toLowerCase().includes("not found")) {
          setErrorMsg(`Invalid subject code: "${rawCode}". No matching subject was found.`);
        } else {
          setErrorMsg(joinData.error || `Failed to join subject with code "${rawCode}".`);
        }
        return;
      }

      const joinedSubj: Subject = joinData.subject;
      setSuccessSubject(joinedSubj);
      setInputCode("");
      await refreshEnrolledSubjects(user.id);
    } catch (err: any) {
      setErrorMsg(err.message || "Network error while joining subject.");
    } finally {
      setSubmitting(false);
    }
  };

  // Stop camera feed and scanning loop
  const stopCamera = useCallback(() => {
    if (scanAnimFrameRef.current) {
      cancelAnimationFrame(scanAnimFrameRef.current);
      scanAnimFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Start camera with rear camera preferred and front camera as fallback
  const startCamera = useCallback(async () => {
    try {
      setCameraStarting(true);
      setCameraError(null);
      setScanSuccessFeedback(false);

      if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera access is not supported in this browser. Please use the Enter Subject Code tab.");
        setCameraStarting(false);
        return;
      }

      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      let stream: MediaStream | null = null;

      // 1. Rear camera preferred
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (errEnvironment) {
        console.warn("Rear camera not available, falling back to front/default camera:", errEnvironment);
        // 2. Front / default camera fallback
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (errFallback: any) {
          throw errFallback;
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      isProcessingRef.current = false;
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError(
          "Camera permission was denied. Please allow camera access in your browser or switch to the Enter Subject Code tab as fallback."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError(
          "No camera device was detected on your system. Please use the Enter Subject Code tab."
        );
      } else {
        setCameraError(err.message || "Failed to start camera. Please use the Enter Subject Code tab.");
      }
    } finally {
      setCameraStarting(false);
    }
  }, []);

  // Tab switching & page lifecycle cleanup
  useEffect(() => {
    if (activeTab === "qr") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab, startCamera, stopCamera]);

  // Continuous QR frame decoding loop
  useEffect(() => {
    if (!cameraActive) return;

    let animId: number;

    const scanFrame = () => {
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA && !isProcessingRef.current) {
        const canvas = canvasRef.current || document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (qrCode && qrCode.data && qrCode.data.trim()) {
            const rawScanned = qrCode.data.trim().toUpperCase();
            isProcessingRef.current = true;
            setLastScannedCode(rawScanned);
            setScanSuccessFeedback(true);

            // Pass decoded QR code directly into the SAME join-by-code flow
            handleJoinByCode(rawScanned).finally(() => {
              setTimeout(() => {
                isProcessingRef.current = false;
                setScanSuccessFeedback(false);
              }, 3000);
            });
          }
        }
      }

      animId = requestAnimationFrame(scanFrame);
      scanAnimFrameRef.current = animId;
    };

    animId = requestAnimationFrame(scanFrame);
    scanAnimFrameRef.current = animId;

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [cameraActive, enrolledSubjects, user]);

  return (
    <main className="w-full pt-20 px-margin-desktop pb-margin-desktop bg-surface min-h-screen">
      <div className="flex flex-col w-full">
        {/* Style tag for laser animations */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
    @keyframes laserSweep {
      0% { top: 6%; opacity: 0.2; }
      50% { top: 88%; opacity: 1; }
      100% { top: 6%; opacity: 0.2; }
    }
    .animate-laser {
      animation: laserSweep 2.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
    }
  `,
          }}
        />

        {/* Top Breadcrumb & Header */}
        <div className="flex flex-col gap-space-md mb-gutter-desktop">
          <div className="flex items-center gap-space-xs font-label-md text-label-md text-outline">
            <span className="hover:text-primary cursor-pointer transition-colors">Academics</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Course Enrollment</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface font-semibold">Join Subject</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
            <div className="flex flex-col max-w-2xl">
              <div className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm w-fit mb-space-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                Active Academic Registration
              </div>
              <h1 className="font-display-md text-display-md text-on-surface tracking-tight font-bold">
                Join a Subject
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-xs">
                Enroll in your curriculum courses by scanning the static subject QR code displayed by your instructor on Manage Subjects, or by entering the course join code.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 bg-surface-container rounded-full shadow-sm shrink-0 self-start lg:self-auto">
              <button
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-space-xs px-space-lg py-space-sm rounded-full font-label-lg text-label-lg transition-all duration-200 ${
                  activeTab === "code"
                    ? "bg-primary-container text-on-primary shadow-md"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">pin</span>
                <span>Enter Subject Code</span>
              </button>
              <button
                onClick={() => setActiveTab("qr")}
                className={`flex items-center gap-space-xs px-space-lg py-space-sm rounded-full font-label-lg text-label-lg transition-all duration-200 ${
                  activeTab === "qr"
                    ? "bg-primary-container text-on-primary shadow-md"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                <span>Scan QR Code</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Loading / Error State Banner */}
        {loading && (
          <div className="p-space-lg rounded-xl bg-surface-container-low mb-gutter flex items-center justify-center gap-space-sm text-primary">
            <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
            <span className="font-label-lg text-label-lg font-semibold">Verifying student authentication...</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-space-md rounded-xl bg-error-container text-on-error-container mb-gutter flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span className="font-body-sm text-body-sm flex-1">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-xs underline font-semibold">
              Dismiss
            </button>
          </div>
        )}

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
          {/* Left Column: QR Scanner or Code Entry Main Panel */}
          <div className="lg:col-span-7 flex flex-col gap-gutter">
            {/* Subject QR Scanner Mode */}
            {activeTab === "qr" && (
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md transition-all flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        Subject QR Code Scanner
                      </h3>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        Scan static subject QR from Manage Subjects
                      </p>
                    </div>
                  </div>
                  {cameraActive && !cameraError && (
                    <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      Camera Active
                    </span>
                  )}
                </div>

                {cameraError ? (
                  <div className="flex flex-col items-center justify-center p-space-xl text-center bg-surface-container-low rounded-xl border border-error/30 gap-space-md aspect-[4/3]">
                    <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-[26px]">videocam_off</span>
                    </div>
                    <div className="flex flex-col gap-1 max-w-md">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        Camera Access Required
                      </h4>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        {cameraError}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-space-sm mt-space-xs">
                      <button
                        onClick={() => setActiveTab("code")}
                        className="px-space-lg py-space-sm rounded-full bg-primary text-on-primary font-label-md text-label-md hover:bg-secondary transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[18px]">pin</span>
                        <span>Enter Subject Code Instead</span>
                      </button>
                      <button
                        onClick={startCamera}
                        disabled={cameraStarting}
                        className="px-space-md py-space-sm rounded-full bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-all"
                      >
                        {cameraStarting ? "Starting..." : "Retry Camera"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black shadow-2xl flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {cameraStarting && !cameraActive && (
                      <div className="absolute inset-0 bg-surface-container-low/90 flex flex-col items-center justify-center gap-space-sm text-primary">
                        <span className="material-symbols-outlined animate-spin text-[32px]">progress_activity</span>
                        <span className="font-label-md text-label-md font-semibold">Initializing camera feed...</span>
                      </div>
                    )}

                    {/* Viewfinder Target Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative w-56 h-56 sm:w-64 sm:h-64">
                        {/* Corner Brackets */}
                        <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg transition-colors ${scanSuccessFeedback ? 'border-green-400' : 'border-secondary'}`}></div>
                        <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg transition-colors ${scanSuccessFeedback ? 'border-green-400' : 'border-secondary'}`}></div>
                        <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg transition-colors ${scanSuccessFeedback ? 'border-green-400' : 'border-secondary'}`}></div>
                        <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-lg transition-colors ${scanSuccessFeedback ? 'border-green-400' : 'border-secondary'}`}></div>

                        {/* Animated Laser line while scanning */}
                        {!scanSuccessFeedback && cameraActive && (
                          <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-secondary to-transparent shadow-[0_0_12px_#6c5ef1] animate-laser"></div>
                        )}

                        {/* Scan feedback flash */}
                        {scanSuccessFeedback && (
                          <div className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-center backdrop-blur-[1px]">
                            <span className="material-symbols-outlined text-green-400 text-[48px]">check_circle</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Status Pill inside video */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
                      <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-label-sm text-label-sm flex items-center gap-1.5 border border-white/10">
                        <span className="material-symbols-outlined text-[16px] text-secondary">
                          {scanSuccessFeedback ? "task_alt" : "center_focus_strong"}
                        </span>
                        <span>
                          {scanSuccessFeedback && lastScannedCode
                            ? `Decoded: ${lastScannedCode}`
                            : "Align QR code within frame"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-space-md">
                    <span className="material-symbols-outlined text-primary text-[22px]">info</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Point your camera at the static subject QR code displayed by your instructor on Manage Subjects, or enter the code manually.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Code Entry Card */}
            {activeTab === "code" && (
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col gap-space-md relative">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shrink-0">
                    <span className="material-symbols-outlined text-[20px]">key</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Enter Subject Code
                    </h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Instant course enrollment passkey
                    </p>
                  </div>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Enter the unique subject join code provided by your instructor to enroll in the course roster.
                </p>

                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
                    Course Enrollment Code
                  </label>
                  <div className="relative flex items-center">
                    <input
                      value={inputCode}
                      onChange={(e) => {
                        setInputCode(e.target.value.toUpperCase());
                        setErrorMsg(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleJoinByCode();
                      }}
                      disabled={submitting}
                      className="w-full h-14 bg-surface-container-low px-space-lg rounded-xl font-headline-md text-headline-md text-primary tracking-widest uppercase focus:outline-none focus:bg-surface-container transition-all font-mono font-bold"
                      placeholder="e.g. MATH-92A3"
                      type="text"
                    />
                    <div className="absolute right-3 flex items-center gap-space-xs">
                      {inputCode.trim() && (
                        <span
                          className="material-symbols-outlined text-secondary text-[22px] cursor-pointer"
                          title="Valid Format"
                        >
                          check_circle
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleJoinByCode()}
                  disabled={submitting || !inputCode.trim()}
                  className="w-full flex items-center justify-center gap-space-xs h-12 rounded-full bg-primary hover:bg-secondary text-on-primary font-label-lg text-label-lg transition-all shadow-md disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      <span>Enrolling in Subject...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                      <span>Find & Join Subject</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Joined Subject Preview / Success Card */}
            {successSubject && (
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col gap-space-md relative overflow-hidden transition-all duration-300">
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-primary-fixed/40 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-space-sm">
                    <span className="px-space-sm py-1 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm uppercase tracking-wider font-bold">
                      Joined Subject
                    </span>
                    <span className="px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Enrolled & Active
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                  <div className="flex flex-col">
                    <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                      {successSubject.subject_code}: {successSubject.name}
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Section {successSubject.section} • Active Curriculum Subject
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-space-sm p-space-md rounded-xl bg-surface-container">
                  <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                    face_retouching_natural
                  </span>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                      Biometric Roster Integration Complete
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Your biometric profile has been linked to {successSubject.name}. Attendance checkpoints will automatically verify your presence.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-space-md pt-space-xs">
                  <Link
                    href="/student/dashboard"
                    className="flex items-center gap-space-xs px-space-xl py-space-sm rounded-full bg-primary hover:bg-secondary transition-all shadow-md text-on-primary font-label-lg text-label-lg"
                  >
                    <span>Go to Student Dashboard</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Success Banner & Recently Joined List */}
          <div className="lg:col-span-5 flex flex-col gap-gutter">
            {/* Success Banner */}
            {successSubject && (
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col gap-space-md relative overflow-hidden transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-fixed/50 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-start gap-space-md">
                  <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-primary shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[28px]">task_alt</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Subject Joined Successfully
                    </span>
                    <span className="font-label-sm text-label-sm text-primary font-semibold mt-0.5">
                      Biometric Handshake Complete
                    </span>
                  </div>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  You are now registered for <strong className="text-on-surface">{successSubject.name}</strong>.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-space-sm pt-space-xs">
                  <Link
                    href="/student/dashboard"
                    className="w-full sm:flex-1 flex items-center justify-center gap-space-xs h-11 rounded-full bg-primary text-on-primary hover:bg-secondary font-label-lg text-label-lg transition-all shadow-sm"
                  >
                    <span>View Dashboard</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Recently Joined Subjects List */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Enrolled Subjects ({enrolledSubjects.length})
                </h3>
                <span className="font-label-sm text-label-sm text-primary font-semibold">Active Roster</span>
              </div>

              {enrolledSubjects.length > 0 ? (
                enrolledSubjects.map((sub) => (
                  <div
                    key={sub.subject_id}
                    className="flex items-center justify-between p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors gap-2"
                  >
                    <div className="flex items-center gap-space-md flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary font-bold text-headline-sm shrink-0">
                        {sub.subject_code.slice(0, 2)}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span
                          className="font-headline-sm text-headline-sm text-on-surface truncate font-semibold"
                          title={`${sub.subject_code}: ${sub.name}`}
                        >
                          {sub.subject_code}: {sub.name}
                        </span>
                        <span className="font-label-sm text-label-sm text-outline">Section {sub.section}</span>
                      </div>
                    </div>
                    <span className="shrink-0 px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                      Active
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-space-md rounded-xl bg-surface-container-low text-center text-on-surface-variant font-body-sm text-body-sm">
                  You are not enrolled in any subjects yet. Enter a code above to join your first course.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
