"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ATTENDANCE_COMPLIANCE_THRESHOLD } from "@/lib/constants";

interface StudentUser {
  id: string;
  name: string;
  role: string;
  created_at?: string;
}

interface Subject {
  subject_id: string;
  subject_code: string;
  name: string;
  section: string;
  teacher_id: string;
  created_at: string;
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
  subject_code?: string;
}

export default function StudentDashboardClient() {
  const [user, setUser] = useState<StudentUser | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initDashboard() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch current session identity
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          setError("Failed to verify user session.");
          setLoading(false);
          return;
        }

        const meData = await meRes.json();
        if (!meData.authenticated || !meData.user) {
          setError("Unauthenticated user session.");
          setLoading(false);
          return;
        }

        const currentUser = meData.user;
        setUser(currentUser);

        // 2. Fetch enrolled subjects and attendance logs for THIS student only
        const studentId = currentUser.id;
        const [subjRes, logsRes] = await Promise.all([
          fetch(`/api/subjects?student_id=${studentId}`),
          fetch(`/api/attendance/logs?student_id=${studentId}`),
        ]);

        if (subjRes.ok) {
          const sData = await subjRes.json();
          setSubjects(sData.subjects || []);
        }

        if (logsRes.ok) {
          const lData = await logsRes.json();
          setLogs(lData.logs || []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load student dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    initDashboard();
  }, []);

  // Compute overall statistics strictly from actual database logs
  const totalLogs = logs.length;
  const presentLogs = logs.filter((l) => l.is_present).length;
  const absentLogs = logs.filter((l) => !l.is_present).length;
  const overallRate = totalLogs > 0 ? Number(((presentLogs / totalLogs) * 100).toFixed(1)) : 0;
  const marginDiff = Number((overallRate - ATTENDANCE_COMPLIANCE_THRESHOLD).toFixed(1));

  // Compute per-subject metrics
  const subjectMetrics = subjects.map((sub) => {
    const subLogs = logs.filter((l) => l.subject_id === sub.subject_id);
    const subPresent = subLogs.filter((l) => l.is_present).length;
    const subTotal = subLogs.length;
    const subRate = subTotal > 0 ? Number(((subPresent / subTotal) * 100).toFixed(1)) : 0;
    const subMargin = Number((subRate - ATTENDANCE_COMPLIANCE_THRESHOLD).toFixed(1));
    return {
      subject: sub,
      total: subTotal,
      present: subPresent,
      rate: subRate,
      margin: subMargin,
      isBreached: subTotal > 0 && subRate < ATTENDANCE_COMPLIANCE_THRESHOLD,
    };
  });

  // Find any subject below ATTENDANCE_COMPLIANCE_THRESHOLD% threshold
  const breachedSubject = subjectMetrics.find((m) => m.isBreached);

  return (
    <div className="flex flex-col w-full gap-gutter-desktop p-space-lg">
      {/* Header section with real logged-in student info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-space-xs">
          <div className="inline-flex items-center gap-2">
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
              Welcome back, {user?.name || "Student"}
            </h1>
            <span className="text-2xl animate-bounce">👋</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-primary">Student Biometric Verification Portal</span>
            <span className="text-outline-variant">•</span>
            <span>
              Student ID:{" "}
              <span className="font-mono font-medium text-on-surface">
                {user?.id ? `${user.id.slice(0, 12)}...` : "—"}
              </span>
            </span>
            <span className="text-outline-variant">•</span>
            <span className="inline-flex items-center gap-1 bg-surface-container-high px-2.5 py-0.5 rounded-full text-label-sm font-label-sm text-primary font-bold">
              Authenticated Session
            </span>
          </p>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          <Link
            href="/student/join"
            className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg shadow-[0_8px_24px_-4px_rgba(75,62,180,0.45)] hover:bg-secondary transition-all transform hover:-translate-y-0.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-xl transition-transform group-hover:rotate-12">
              qr_code_scanner
            </span>
            <span>+ Join Subject / Scan QR</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1"></span>
          </Link>
        </div>
      </div>

      {/* Loading Banner */}
      {loading && (
        <div className="p-space-lg rounded-2xl bg-surface-container-low flex items-center justify-center gap-space-sm text-primary">
          <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
          <span className="font-label-lg text-label-lg font-semibold">Loading student attendance profile...</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-space-md rounded-2xl bg-error-container text-on-error-container flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="font-body-sm text-body-sm">{error}</span>
        </div>
      )}

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
        {/* Overall Attendance */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-space-lg shadow-[0_4px_24px_-2px_rgba(75,62,180,0.06)] hover:shadow-[0_12px_32px_-4px_rgba(75,62,180,0.12)] transition-all">
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
              Overall Attendance
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700">
              <span className="material-symbols-outlined text-xl leading-none">insights</span>
            </span>
          </div>
          <div className="flex items-baseline gap-3 mb-space-sm">
            <span className="font-display-lg text-display-lg text-on-surface tracking-tight font-bold">
              {overallRate}%
            </span>
            <div className="w-10 h-10 relative flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-surface-container-high"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                ></path>
                <path
                  className={overallRate >= ATTENDANCE_COMPLIANCE_THRESHOLD ? "text-emerald-500" : "text-rose-500"}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${Math.min(100, overallRate)}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                ></path>
              </svg>
              <span className="material-symbols-outlined absolute text-xs text-emerald-600 font-bold">
                {overallRate >= ATTENDANCE_COMPLIANCE_THRESHOLD ? "arrow_upward" : "arrow_downward"}
              </span>
            </div>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-bold ${
              overallRate >= ATTENDANCE_COMPLIANCE_THRESHOLD ? "bg-emerald-500/10 text-emerald-800" : "bg-error-container text-on-error-container"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${overallRate >= ATTENDANCE_COMPLIANCE_THRESHOLD ? "bg-emerald-500" : "bg-error"}`}
            ></span>
            <span>
              {overallRate >= ATTENDANCE_COMPLIANCE_THRESHOLD
                ? `+${marginDiff}% Above ${ATTENDANCE_COMPLIANCE_THRESHOLD}% Safe Margin`
                : `${Math.abs(marginDiff)}% Below ${ATTENDANCE_COMPLIANCE_THRESHOLD}% Floor`}
            </span>
          </div>
        </div>

        {/* Classes Attended */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-space-lg shadow-[0_4px_24px_-2px_rgba(75,62,180,0.06)] hover:shadow-[0_12px_32px_-4px_rgba(75,62,180,0.12)] transition-all">
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
              Classes Attended
            </span>
            <span className="p-2 rounded-xl bg-secondary-fixed text-primary">
              <span className="material-symbols-outlined text-xl leading-none">task_alt</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-space-sm">
            <span className="font-display-lg text-display-lg text-on-surface tracking-tight font-bold">
              {presentLogs}
            </span>
            <span className="font-headline-lg text-headline-lg text-on-surface-variant">/ {totalLogs}</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Verified attendance records across {subjects.length} active courses
          </p>
        </div>

        {/* Classes Missed */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-space-lg shadow-[0_4px_24px_-2px_rgba(75,62,180,0.06)] hover:shadow-[0_12px_32px_-4px_rgba(75,62,180,0.12)] transition-all">
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
              Classes Missed
            </span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <span className="material-symbols-outlined text-xl leading-none">event_busy</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-space-sm">
            <span className="font-display-lg text-display-lg text-rose-600 tracking-tight font-bold">
              {absentLogs}
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-medium">Sessions</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Recorded unverified / absent sessions
          </p>
        </div>

        {/* Enrolled Subjects */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-space-lg shadow-[0_4px_24px_-2px_rgba(75,62,180,0.06)] hover:shadow-[0_12px_32px_-4px_rgba(75,62,180,0.12)] transition-all">
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
              Enrolled Subjects
            </span>
            <span className="p-2 rounded-xl bg-primary-container/15 text-primary">
              <span className="material-symbols-outlined text-xl leading-none">auto_stories</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-space-sm">
            <span className="font-display-lg text-display-lg text-on-surface tracking-tight font-bold">
              {subjects.length}
            </span>
            <span className="font-headline-sm text-headline-sm text-emerald-700 font-semibold">Active</span>
          </div>
          <div className="flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>Registered in database</span>
          </div>
        </div>
      </div>

      {/* Compliance Notice Banner */}
      {breachedSubject ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 via-rose-50/70 to-surface-container-lowest p-space-lg shadow-[0_8px_24px_rgba(186,26,26,0.08)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md relative z-10">
            <div className="flex items-start gap-3.5 max-w-4xl">
              <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Mandatory Attendance Compliance Warning
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-error text-on-error font-label-sm text-label-sm font-bold uppercase tracking-wider">
                    Critical
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  You are currently below the <strong className="text-on-surface font-semibold">{ATTENDANCE_COMPLIANCE_THRESHOLD}% mandatory accreditation floor</strong> in{" "}
                  <span className="font-semibold text-error">
                    {breachedSubject.subject.subject_code} ({breachedSubject.subject.name} - {breachedSubject.rate}%)
                  </span>
                  . Cumulative verified attendance of ≥{ATTENDANCE_COMPLIANCE_THRESHOLD}% is required for accreditation.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-space-md flex items-center gap-space-md text-emerald-900">
          <span className="material-symbols-outlined text-2xl text-emerald-600">verified</span>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm font-bold">Institutional Accreditation Status: Compliant</span>
            <span className="font-body-sm text-body-sm text-emerald-800">
              All enrolled courses are currently meeting or exceeding the mandatory {ATTENDANCE_COMPLIANCE_THRESHOLD}% attendance floor.
            </span>
          </div>
        </div>
      )}

      {/* Course Attendance Trackers */}
      <div className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
              Course Attendance Trackers
            </h2>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Real-time breakdown calculated from database attendance logs
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {subjectMetrics.length > 0 ? (
            subjectMetrics.map((sm) => (
              <div
                key={sm.subject.subject_id}
                className="group bg-surface-container-lowest rounded-2xl p-space-lg shadow-[0_4px_20px_-2px_rgba(75,62,180,0.05)] hover:shadow-[0_12px_28px_rgba(75,62,180,0.12)] hover:-translate-y-1 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label-md text-label-md text-primary font-bold tracking-wider">
                      {sm.subject.subject_code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-sm text-label-sm font-bold ${
                        sm.total === 0
                          ? "bg-surface-container-high text-on-surface-variant"
                          : sm.rate >= ATTENDANCE_COMPLIANCE_THRESHOLD
                          ? "bg-emerald-500/15 text-emerald-800"
                          : "bg-error-container text-on-error-container"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          sm.total === 0 ? "bg-outline" : sm.rate >= ATTENDANCE_COMPLIANCE_THRESHOLD ? "bg-emerald-500" : "bg-error"
                        }`}
                      ></span>
                      <span>
                        {sm.total === 0
                          ? "No Logs Yet"
                          : sm.rate >= ATTENDANCE_COMPLIANCE_THRESHOLD
                          ? `${sm.rate}% • Safe`
                          : `${sm.rate}% • Action Required`}
                      </span>
                    </span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface line-clamp-1 mb-1 font-bold">
                    {sm.subject.name}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                    Section: {sm.subject.section}
                  </p>

                  <div className="space-y-2 mb-space-md">
                    <div className="flex justify-between text-label-sm font-label-sm">
                      <span className="text-on-surface-variant font-medium">Classes Attended</span>
                      <span className="font-bold text-on-surface">
                        {sm.present} / {sm.total} <span className="text-on-surface-variant font-normal">({sm.rate}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${sm.rate >= ATTENDANCE_COMPLIANCE_THRESHOLD ? "bg-emerald-500" : "bg-error"}`}
                        style={{ width: `${Math.min(100, sm.rate)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between font-label-sm text-label-sm">
                      <span className={sm.rate >= ATTENDANCE_COMPLIANCE_THRESHOLD ? "text-emerald-700 font-semibold" : "text-error font-semibold"}>
                        {sm.total === 0
                          ? "0 logs registered"
                          : sm.rate >= ATTENDANCE_COMPLIANCE_THRESHOLD
                          ? `+${sm.margin}% above floor`
                          : `${Math.abs(sm.margin)}% below floor`}
                      </span>
                      <span className="text-on-surface-variant">Min Req: {ATTENDANCE_COMPLIANCE_THRESHOLD}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-space-xl bg-surface-container-lowest rounded-2xl text-center text-on-surface-variant">
              No enrolled subjects found for your student profile.
            </div>
          )}
        </div>
      </div>

      {/* Main Bottom Grid: Table & Scanner Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop">
        {/* Attendance Log Table */}
        <div className="lg:col-span-8 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-[0_4px_24px_-2px_rgba(75,62,180,0.06)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-lg">
              <div className="flex flex-col">
                <h2 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
                  Recent Attendance History
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Chronological biometric verification and scan telemetry from database
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider rounded-xl">
                    <th className="py-3 px-4 rounded-l-xl">Date & Time</th>
                    <th className="py-3 px-4">Course Details</th>
                    <th className="py-3 px-4">Verification Telemetry</th>
                    <th className="py-3 px-4 rounded-r-xl text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {logs.length > 0 ? (
                    logs.map((log) => {
                      const dt = new Date(log.timestamp);
                      const dateStr = dt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                      const timeStr = dt.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <tr key={log.log_id} className="hover:bg-surface-container-low/60 transition-colors">
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                                {dateStr}
                              </span>
                              <span className="font-body-sm text-body-sm text-on-surface-variant">{timeStr}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                                {log.subject_name || "Subject"}
                              </span>
                              <span className="font-body-sm text-body-sm text-on-surface-variant font-mono">
                                {log.subject_code || log.subject_id}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {log.method === "face" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 font-label-sm text-label-sm font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>AI Face Biometric</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-container/10 text-primary font-label-sm text-label-sm font-semibold">
                                <span className="material-symbols-outlined text-xs">qr_code_2</span>
                                <span>Dynamic QR Scan</span>
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {log.is_present ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-800 font-label-sm text-label-sm font-bold uppercase">
                                PRESENT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-error text-on-error font-label-sm text-label-sm font-bold uppercase">
                                ABSENT
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-on-surface-variant font-body-md text-body-md">
                        No attendance records logged yet for your account.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pt-space-md mt-space-md border-t border-surface-container-high flex items-center justify-between">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Showing {logs.length} verified events
              </span>
            </div>
          </div>
        </div>

        {/* Side Panel: Biometric ID & Scanner */}
        <div className="lg:col-span-4 flex flex-col gap-space-lg">
          {/* Live Scanner Callout */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-container to-secondary text-on-primary rounded-2xl p-space-lg shadow-[0_8px_32px_-4px_rgba(75,62,180,0.35)] flex flex-col justify-between">
            <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-secondary-container/30 blur-2xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col gap-space-sm mb-space-lg">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-label-sm font-label-sm font-bold uppercase tracking-wider text-surface">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Scanner Ready
                </span>
                <span className="material-symbols-outlined text-surface/70 text-2xl">sensors</span>
              </div>
              <div className="flex flex-col">
                <h3 className="font-headline-lg text-headline-lg text-white font-bold">Classroom Attendance</h3>
                <p className="font-body-sm text-body-sm text-surface/80 leading-snug mt-1">
                  Point your camera at the teacher's code or present your face in-class.
                </p>
              </div>

              <Link
                href="/student/join"
                className="w-full mt-4 py-3 px-4 rounded-full bg-white text-primary font-label-lg text-label-lg font-bold shadow-lg hover:bg-surface-bright transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
                <span>Join Subject / Scan Code</span>
              </Link>
            </div>
          </div>

          {/* Biometric ID Status Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-[0_4px_24px_-2px_rgba(75,62,180,0.06)] flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-xl">face</span>
                </span>
                <div className="flex flex-col">
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">Biometric ID Status</h4>
                  <span className="font-label-sm text-label-sm text-emerald-700 font-semibold">
                    Registered Profile
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-emerald-600">verified</span>
            </div>

            <div className="space-y-space-sm bg-surface-container-low p-space-md rounded-xl">
              <div className="flex justify-between items-center text-body-sm font-body-sm">
                <span className="text-on-surface-variant">Student Name</span>
                <span className="font-semibold text-on-surface">{user?.name || "Student"}</span>
              </div>
              <div className="flex justify-between items-center text-body-sm font-body-sm">
                <span className="text-on-surface-variant">Face Verification</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Active</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
