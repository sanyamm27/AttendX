"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

interface Student {
  student_id: string;
  name: string;
}

interface AuthUser {
  name: string;
  username?: string;
  role: string;
}

export default function TeacherDashboardClient() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setAuthUser(data.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [subjRes, logRes, studentRes] = await Promise.all([
          fetch("/api/subjects"),
          fetch("/api/attendance/logs"),
          fetch("/api/students"),
        ]);

        if (subjRes.ok) {
          const sData = await subjRes.json();
          setSubjects(sData.subjects || []);
        }

        if (logRes.ok) {
          const lData = await logRes.json();
          setLogs(lData.logs || []);
        }

        if (studentRes.ok) {
          const stData = await studentRes.json();
          setStudents(stData.students || []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Compute derived statistics from real data
  const totalStudentsCount = students.length;
  const activeSubjectsCount = subjects.length;
  const presentTodayCount = logs.filter((l) => l.is_present).length;
  const absentCount = logs.filter((l) => !l.is_present).length;

  return (
    <div className="w-full pt-16 bg-surface min-h-screen px-space-lg pb-space-xl flex flex-col gap-space-lg">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
                  Good morning, {authUser?.name || "Professor"}
                </h1>
                <span className="text-2xl animate-pulse">👋</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                Here is what's happening across your connected lecture halls and active courses today.
              </p>
            </div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <button className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-full bg-surface-container-lowest text-primary hover:bg-surface-container shadow-sm transition-all text-label-lg font-label-lg">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                <span>Schedule Session</span>
              </button>
              <Link
                href="/teacher/attendance"
                className="inline-flex items-center gap-space-xs px-space-lg py-2.5 rounded-full bg-primary text-on-primary hover:bg-secondary shadow-md hover:shadow-lg transition-all text-label-lg font-label-lg"
              >
                <span className="material-symbols-outlined text-[20px]">center_focus_strong</span>
                <span>+ Take Attendance Now</span>
              </Link>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-error-container text-error font-body-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => window.location.reload()} className="underline font-semibold ml-4">
                Retry
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {/* Total Students */}
            <div className="p-space-md rounded-[20px] bg-surface-container-lowest shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                  Total Students
                </span>
                <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">groups</span>
                </div>
              </div>
              <div className="mt-space-sm">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-display-md text-display-md text-on-surface font-bold">
                    {loading ? "..." : totalStudentsCount}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant font-medium">Enrolled</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center text-label-sm font-label-sm text-secondary font-semibold bg-secondary-fixed/50 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span> Real-time
                  </span>
                  <span className="font-body-sm text-body-sm text-outline truncate">Active Roster</span>
                </div>
              </div>
            </div>

            {/* Present Today */}
            <div className="p-space-md rounded-[20px] bg-surface-container-lowest shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                  Present Logged
                </span>
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                </div>
              </div>
              <div className="mt-space-sm">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-display-md text-display-md text-on-surface font-bold">
                    {loading ? "..." : presentTodayCount}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant font-medium">Verified</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container-highest text-primary font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Biometric
                  </span>
                  <span className="font-body-sm text-body-sm text-outline truncate">Face Logs</span>
                </div>
              </div>
            </div>

            {/* Absent Today */}
            <div className="p-space-md rounded-[20px] bg-surface-container-lowest shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                  Absent Records
                </span>
                <div className="w-9 h-9 rounded-full bg-error-container flex items-center justify-center text-error">
                  <span className="material-symbols-outlined text-[18px]">person_off</span>
                </div>
              </div>
              <div className="mt-space-sm">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-display-md text-display-md text-on-surface font-bold">
                    {loading ? "..." : absentCount}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant font-medium">Students</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-error-container text-error font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                    Unverified
                  </span>
                  <span className="font-body-sm text-body-sm text-outline truncate">Roll Checks</span>
                </div>
              </div>
            </div>

            {/* Active Subjects */}
            <div className="p-space-md rounded-[20px] bg-surface-container-lowest shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                  Active Subjects
                </span>
                <div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                </div>
              </div>
              <div className="mt-space-sm">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-display-md text-display-md text-on-surface font-bold">
                    {loading ? "..." : activeSubjectsCount}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant font-medium">Courses</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container text-on-surface-variant font-semibold">
                    <span className="material-symbols-outlined text-[14px]">event_seat</span>
                    Active Courses
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            <div className="lg:col-span-8 flex flex-col gap-space-lg">
              {/* Active Real Subjects List / Cards */}
              <div className="p-space-lg rounded-[20px] bg-surface-container-lowest shadow-sm flex flex-col gap-space-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                      Your Connected Subjects
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Real subjects created in backend database
                    </p>
                  </div>
                  <Link
                    href="/teacher/subjects"
                    className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-secondary transition-all"
                  >
                    Manage Subjects
                  </Link>
                </div>

                {loading ? (
                  <div className="p-8 text-center text-outline font-body-md animate-pulse">
                    Loading your subjects from backend...
                  </div>
                ) : subjects.length === 0 ? (
                  <div className="p-8 text-center bg-surface-container-low rounded-xl flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-[36px] text-outline">menu_book</span>
                    <p className="font-headline-sm text-on-surface font-semibold">No active subjects yet</p>
                    <p className="font-body-sm text-on-surface-variant max-w-sm">
                      Create your first course under Manage Subjects to generate join codes and QR badges.
                    </p>
                    <Link
                      href="/teacher/subjects"
                      className="mt-2 px-4 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold"
                    >
                      + Create Subject
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                    {subjects.map((subj) => (
                      <div
                        key={subj.subject_id}
                        className="p-4 rounded-xl border border-surface-container bg-surface-container-low hover:bg-surface-container-lowest transition-all flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-label-sm text-[11px] font-bold text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded-full uppercase">
                              {subj.subject_code}
                            </span>
                            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">
                              {subj.name}
                            </h3>
                            <p className="font-body-sm text-body-sm text-outline">Section: {subj.section}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[18px]">class</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-surface-container text-label-sm">
                          <span className="text-outline">ID: {subj.subject_id.slice(0, 8)}...</span>
                          <Link
                            href="/teacher/attendance"
                            className="text-primary hover:underline font-semibold flex items-center gap-1"
                          >
                            <span>Take Attendance</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attendance Sessions / Roster Audit Table */}
              <div className="p-space-lg rounded-[20px] bg-surface-container-lowest shadow-sm flex flex-col gap-space-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                      Recent Attendance Records
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Real biometric and scanned student attendance logs
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider h-11">
                        <th className="px-space-md rounded-l-lg">Student &amp; Subject</th>
                        <th className="px-space-sm">Verification Mode</th>
                        <th className="px-space-sm">Timestamp</th>
                        <th className="px-space-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container font-body-md text-body-md">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-outline animate-pulse">
                            Loading attendance records...
                          </td>
                        </tr>
                      ) : logs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-outline">
                            No attendance records logged yet.
                          </td>
                        </tr>
                      ) : (
                        logs.slice(0, 5).map((log) => (
                          <tr key={log.log_id} className="hover:bg-surface-container-low/60 transition-colors h-16">
                            <td className="px-space-md">
                              <div className="flex flex-col">
                                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                                  {log.student_name || `Student ${log.student_id.slice(0, 6)}`}
                                </span>
                                <span className="font-label-sm text-label-sm text-outline">
                                  {log.subject_name || log.subject_code || `Subject ${log.subject_id.slice(0, 6)}`}
                                </span>
                              </div>
                            </td>
                            <td className="px-space-sm">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-primary-fixed text-primary font-semibold">
                                <span className="material-symbols-outlined text-[15px]">
                                  {log.method === "face" ? "center_focus_strong" : "qr_code_2"}
                                </span>
                                {log.method === "face" ? "AI Face Recognition" : "Static QR Code"}
                              </span>
                            </td>
                            <td className="px-space-sm font-body-sm text-body-sm text-on-surface-variant">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-space-sm">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm font-semibold ${
                                  log.is_present
                                    ? "bg-surface-container-highest text-primary"
                                    : "bg-error-container text-error"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    log.is_present ? "bg-primary" : "bg-error"
                                  }`}
                                ></span>
                                {log.is_present ? "Present" : "Absent"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-4 flex flex-col gap-space-lg">
              {/* Fast Actions */}
              <div className="p-space-lg rounded-[20px] bg-surface-container-lowest shadow-sm flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Fast Actions</h2>
                  <span className="font-label-sm text-label-sm text-outline font-semibold uppercase tracking-wider">
                    Touch Controls
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-space-sm">
                  <Link
                    href="/teacher/attendance"
                    className="p-space-md rounded-2xl bg-surface-container-low hover:bg-primary-fixed/40 transition-all flex flex-col gap-space-xs text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">camera_indoor</span>
                    </div>
                    <span className="font-headline-sm text-[14px] text-on-surface font-bold mt-1 leading-tight">
                      Start AI Recognition
                    </span>
                    <span className="font-body-sm text-[11px] text-on-surface-variant line-clamp-2">
                      Upload classroom photo or webcam
                    </span>
                  </Link>

                  <Link
                    href="/teacher/subjects"
                    className="p-space-md rounded-2xl bg-surface-container-low hover:bg-secondary-fixed/40 transition-all flex flex-col gap-space-xs text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-secondary text-on-secondary flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                    </div>
                    <span className="font-headline-sm text-[14px] text-on-surface font-bold mt-1 leading-tight">
                      Manage QR Badges
                    </span>
                    <span className="font-body-sm text-[11px] text-on-surface-variant line-clamp-2">
                      View &amp; print static subject QR codes
                    </span>
                  </Link>
                </div>
              </div>

              {/* Biometric Engine Status */}
              <div className="p-space-lg rounded-[20px] bg-inverse-surface text-inverse-on-surface shadow-md flex flex-col gap-space-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary-fixed text-[20px]">security</span>
                    <h3 className="font-headline-sm text-headline-sm font-bold">Biometric Engine Vault</h3>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-label-sm font-bold bg-surface-variant/20 text-secondary-fixed px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed"></span> ONLINE
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-outline-variant">
                  FastAPI service active with 128-d face embeddings and LinearSVC classroom matching.
                </p>
              </div>
            </div>
          </div>
    </div>
  );
}
