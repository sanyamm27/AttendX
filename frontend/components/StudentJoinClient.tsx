"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
    const rawCode = (codeToSubmit || inputCode).trim();
    if (!rawCode) {
      setErrorMsg("Please enter a valid subject join code.");
      return;
    }

    if (!user || !user.id) {
      setErrorMsg("User authentication required to join a subject.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      // First query available subjects to find subject_id by subject_code if needed
      let targetSubjectId = "bycode";
      const allSubjRes = await fetch("/api/subjects");
      if (allSubjRes.ok) {
        const allData = await allSubjRes.json();
        const found = (allData.subjects || []).find(
          (s: Subject) => s.subject_code.toLowerCase() === rawCode.toLowerCase()
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
        setErrorMsg(joinData.error || "Failed to join subject. Invalid code or server error.");
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
    @keyframes pulseRing {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.05); opacity: 0.3; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }
    .animate-pulse-ring {
      animation: pulseRing 3.5s ease-in-out infinite;
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
                Enroll in your curriculum courses via dynamic instructor QR code or unique course entry passcode with instant biometric profile handshake.
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
            {/* Dynamic QR Scanner Mode */}
            {activeTab === "qr" && (
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md transition-all flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[22px]">center_focus_strong</span>
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        Dynamic QR Scanner
                      </h3>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        Align instructor screen QR code
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-inverse-surface shadow-2xl flex items-center justify-center group">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity filter contrast-125"
                    style={{ backgroundImage: "url('/images/classroom.svg')" }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-inverse-surface/80 via-transparent to-inverse-surface/90"></div>

                  <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center z-10">
                    <div className="absolute inset-0 rounded-2xl bg-secondary/15 filter blur-xl animate-pulse-ring"></div>
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-secondary rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-secondary rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-secondary rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-secondary rounded-br-lg"></div>
                    <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-secondary-container to-transparent shadow-[0_0_12px_#6c5ef1] animate-laser pointer-events-none"></div>

                    <div className="w-44 h-44 rounded-xl bg-surface-container-lowest/10 backdrop-blur-sm p-space-md flex flex-col items-center justify-center text-center">
                      <span className="material-symbols-outlined text-secondary-fixed text-[64px] opacity-85">
                        qr_code_2
                      </span>
                      <span className="font-label-sm text-label-sm text-inverse-on-surface mt-space-xs tracking-wider uppercase font-semibold">
                        Align Instructor QR
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-space-md">
                    <span className="material-symbols-outlined text-primary text-[22px]">info</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Point your camera at the instructor's live projector screen or enter code directly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Code Entry Card */}
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
