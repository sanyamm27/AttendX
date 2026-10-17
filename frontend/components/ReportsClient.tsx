"use client";

import { useEffect, useState, useMemo } from "react";
import { ATTENDANCE_COMPLIANCE_THRESHOLD } from '@/lib/constants';

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

interface AnalyticsData {
  total_logs: number;
  present_count: number;
  absent_count: number;
  present_rate: number;
  daily_trends: Array<{
    date: string;
    present_count: number;
    total_logs: number;
    rate: number;
  }>;
  mode_distribution: {
    face: number;
    qr: number;
    total: number;
    face_percentage: number;
    qr_percentage: number;
  };
  low_attendance_students: Array<{
    student_id: string;
    name: string;
    rate: number;
    total_logs: number;
    present_count: number;
  }>;
}

export default function ReportsClient() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  // Fetch Subjects on initial mount
  useEffect(() => {
    async function fetchSubjects() {
      try {
        const res = await fetch("/api/subjects");
        if (res.ok) {
          const data = await res.json();
          setSubjects(data.subjects || []);
        }
      } catch (err) {
        console.error("Failed to load subjects:", err);
      }
    }
    fetchSubjects();
  }, []);

  // Fetch logs and analytics whenever selectedSubjectId changes
  useEffect(() => {
    async function fetchReportData() {
      try {
        setLoading(true);
        setError(null);

        const queryStr = selectedSubjectId ? `?subject_id=${encodeURIComponent(selectedSubjectId)}` : "";

        const [logsRes, analyticsRes] = await Promise.all([
          fetch(`/api/attendance/logs${queryStr}`),
          fetch(`/api/reports/analytics${queryStr}`),
        ]);

        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setLogs(logsData.logs || []);
        } else {
          setError("Failed to fetch attendance logs.");
        }

        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData.analytics || null);
        } else {
          setError("Failed to fetch analytics.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while loading reports.");
      } finally {
        setLoading(false);
      }
    }

    fetchReportData();
  }, [selectedSubjectId]);

  // Filter logs locally by search query, method, status
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search filter (student name or student ID)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = log.student_name?.toLowerCase().includes(q);
        const matchesId = log.student_id.toLowerCase().includes(q);
        if (!matchesName && !matchesId) return false;
      }

      // Method filter
      if (selectedMethod !== "all" && log.method !== selectedMethod) {
        return false;
      }

      // Status filter
      if (selectedStatus === "present" && !log.is_present) return false;
      if (selectedStatus === "absent" && log.is_present) return false;

      return true;
    });
  }, [logs, searchQuery, selectedMethod, selectedStatus]);

  // Paginated logs
  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredLogs.slice(start, start + rowsPerPage);
  }, [filteredLogs, currentPage, rowsPerPage]);

  const handleExportCSV = () => {
    if (!filteredLogs.length) return;

    const headers = ["Timestamp", "Student ID", "Student Name", "Subject", "Method", "Status"];
    const rows = filteredLogs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.student_id,
      `"${log.student_name || 'Unknown'}"`,
      `"${log.subject_name || log.subject_id}"`,
      log.method,
      log.is_present ? "PRESENT" : "ABSENT",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setSelectedSubjectId("");
    setSearchQuery("");
    setSelectedMethod("all");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  // Helper for trend chart coordinates
  const renderTrendChart = () => {
    if (!analytics || !analytics.daily_trends || analytics.daily_trends.length === 0) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined text-[36px] mb-2 text-outline">analytics</span>
          <p className="font-body-sm text-body-sm">No historical attendance data recorded yet for trend analysis.</p>
        </div>
      );
    }

    const trends = analytics.daily_trends;
    const chartWidth = 760;
    const chartHeight = 200;
    const paddingX = 40;
    const availableWidth = chartWidth - paddingX * 2;

    const points = trends.map((t, index) => {
      const x = trends.length === 1 ? chartWidth / 2 : paddingX + (index / (trends.length - 1)) * availableWidth;
      // Y scale: 100% at y=20, 0% at y=190
      const y = 190 - (t.rate / 100) * 170;
      return { x, y, ...t };
    });

    const svgPath = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`;
    }, "");

    const areaPath = `${svgPath} L ${points[points.length - 1].x},200 L ${points[0].x},200 Z`;

    return (
      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 760 240">
        <defs>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4B3EB4" stopOpacity="0.28" />
            <stop offset="70%" stopColor="#6355E8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#FAF8FF" stopOpacity="0" />
          </linearGradient>
          <filter height="140%" id="softGlow" width="140%" x="-20%" y="-20%">
            <feDropShadow dx="0" dy="4" floodColor="#4B3EB4" floodOpacity="0.3" stdDeviation="4" />
          </filter>
        </defs>

        {/* Grid lines */}
        <line stroke="#EFEDF3" strokeWidth="1" x1="0" x2="760" y1="20" y2="20" />
        <text fill="#787584" fontFamily="Inter" fontSize="10" fontWeight="600" x="5" y="16">100%</text>

        <line stroke="#EFEDF3" strokeWidth="1" x1="0" x2="760" y1="62.5" y2="62.5" />
        <text fill="#787584" fontFamily="Inter" fontSize="10" fontWeight="600" x="5" y="58.5">{ATTENDANCE_COMPLIANCE_THRESHOLD}%</text>

        {/* Accreditation {ATTENDANCE_COMPLIANCE_THRESHOLD}% threshold line */}
        <line stroke="#BA1A1A" strokeDasharray="6,6" strokeOpacity="0.75" strokeWidth="1.5" x1="0" x2="760" y1="62.5" y2="62.5" />
        <rect fill="#FFDAD6" fillOpacity="0.85" height="20" rx="4" width="175" x="580" y="50" />
        <text fill="#93000A" fontFamily="Inter" fontSize="9" fontWeight="700" x="586" y="64">{ATTENDANCE_COMPLIANCE_THRESHOLD}% MANDATORY ACCREDITATION</text>

        <line stroke="#EFEDF3" strokeWidth="1" x1="0" x2="760" y1="105" y2="105" />
        <text fill="#787584" fontFamily="Inter" fontSize="10" fontWeight="600" x="5" y="101">50%</text>

        <line stroke="#EFEDF3" strokeWidth="1" x1="0" x2="760" y1="190" y2="190" />
        <text fill="#787584" fontFamily="Inter" fontSize="10" fontWeight="600" x="5" y="186">0%</text>

        {/* Chart fill & line */}
        <path d={areaPath} fill="url(#areaGradient)" />
        <path d={svgPath} fill="none" filter="url(#softGlow)" stroke="#4B3EB4" strokeLinecap="round" strokeWidth="3.5" />

        {/* Points */}
        {points.map((p, idx) => (
          <g key={p.date}>
            <circle cx={p.x} cy={p.y} fill="#FFFFFF" r="5" stroke="#4B3EB4" strokeWidth="3" />
            <text fill="#787584" fontFamily="Inter" fontSize="11" x={p.x - 18} y="225">
              {p.date}
            </text>
            <text fill="#4B3EB4" fontFamily="Inter" fontSize="10" fontWeight="700" x={p.x - 12} y={p.y - 10}>
              {p.rate}%
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="w-full pt-16 bg-surface min-h-screen px-space-lg pb-space-xl flex flex-col">
      <div className="flex flex-col w-full">
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
            <div className="flex flex-col gap-space-xs">
              <nav className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
                <span>Academics</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span>Analytics & Compliance</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">Attendance Reports</span>
              </nav>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
                Attendance Reports
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                Analyze verification rates across active subjects, inspect attendance logs, and export accreditation compliance records.
              </p>
            </div>

            <div className="flex items-center gap-space-sm self-start md:self-auto">
              <button
                onClick={handleExportCSV}
                disabled={!filteredLogs.length}
                className="h-11 px-space-md rounded-full bg-surface-container-lowest text-primary hover:bg-surface-container font-label-lg text-label-lg shadow-sm transition-all flex items-center gap-space-xs disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">file_download</span>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm mb-space-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {/* Subject Select */}
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                  Assigned Subject
                </label>
                <div className="relative">
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full h-11 pl-space-md pr-space-lg bg-surface-container-low rounded-xl text-on-surface font-body-sm text-body-sm appearance-none focus:outline-none focus:bg-surface-bright cursor-pointer font-medium"
                  >
                    <option value="">All Subjects ({subjects.length} Active)</option>
                    {subjects.map((sub) => (
                      <option key={sub.subject_id} value={sub.subject_id}>
                        {sub.subject_code}: {sub.name} (Sec {sub.section})
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-space-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Student Identity Search */}
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                  Student Search
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    badge
                  </span>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-9 pr-space-sm bg-surface-container-low rounded-xl text-on-surface font-body-sm text-body-sm placeholder:text-on-surface-variant/60 focus:outline-none"
                    placeholder="Search name or student ID..."
                    type="text"
                  />
                </div>
              </div>

              {/* Verification Mode */}
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                  Verification Mode
                </label>
                <div className="relative">
                  <select
                    value={selectedMethod}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="w-full h-11 pl-space-md pr-space-lg bg-surface-container-low rounded-xl text-on-surface font-body-sm text-body-sm appearance-none focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Modes (Face & QR)</option>
                    <option value="face">AI Face Biometric</option>
                    <option value="qr">Dynamic QR Code</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-space-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Status Select */}
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                  Attendance Status
                </label>
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full h-11 pl-space-md pr-space-lg bg-surface-container-low rounded-xl text-on-surface font-body-sm text-body-sm appearance-none focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="present">Verified Present</option>
                    <option value="absent">Flagged Absent</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-space-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-space-md pt-space-sm">
              <div className="flex flex-wrap items-center gap-space-xs">
                <span className="font-label-sm text-label-sm uppercase text-on-surface-variant font-semibold mr-space-xs">
                  Active Filters:
                </span>
                {selectedSubjectId && (
                  <span className="inline-flex items-center gap-1 px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-medium">
                    Subject: {subjects.find((s) => s.subject_id === selectedSubjectId)?.subject_code || selectedSubjectId}
                    <span
                      onClick={() => setSelectedSubjectId("")}
                      className="material-symbols-outlined text-[12px] cursor-pointer"
                    >
                      close
                    </span>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm">
                    Search: "{searchQuery}"
                    <span onClick={() => setSearchQuery("")} className="material-symbols-outlined text-[12px] cursor-pointer">
                      close
                    </span>
                  </span>
                )}
                {selectedMethod !== "all" && (
                  <span className="inline-flex items-center gap-1 px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm capitalize">
                    Mode: {selectedMethod}
                    <span onClick={() => setSelectedMethod("all")} className="material-symbols-outlined text-[12px] cursor-pointer">
                      close
                    </span>
                  </span>
                )}
                {selectedStatus !== "all" && (
                  <span className="inline-flex items-center gap-1 px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm capitalize">
                    Status: {selectedStatus}
                    <span onClick={() => setSelectedStatus("all")} className="material-symbols-outlined text-[12px] cursor-pointer">
                      close
                    </span>
                  </span>
                )}
              </div>
              <button
                onClick={resetFilters}
                className="text-secondary font-label-sm text-label-sm font-semibold hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          </div>

          {/* Loading / Error Banners */}
          {loading && (
            <div className="p-space-lg rounded-2xl bg-surface-container-low mb-space-lg flex items-center justify-center gap-space-sm text-primary">
              <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
              <span className="font-label-lg text-label-lg font-semibold">Fetching attendance analytics...</span>
            </div>
          )}

          {error && (
            <div className="p-space-md rounded-2xl bg-error-container text-on-error-container mb-space-lg flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span className="font-body-sm text-body-sm">{error}</span>
            </div>
          )}

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-lg mb-space-xl">
            {/* Total Sessions / Logs */}
            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-fixed/20 rounded-full blur-xl pointer-events-none"></div>
              <div className="flex items-start justify-between gap-2 mb-space-md">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold leading-snug min-w-0 flex-1 pr-1 break-words">
                  Total Logs
                </span>
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">co_present</span>
                </div>
              </div>
              <div>
                <div className="font-headline-xl text-headline-xl text-on-surface font-bold">
                  {analytics ? `${analytics.total_logs} Records` : "0 Records"}
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-1 flex items-center gap-1 flex-wrap break-words">
                  <span className="text-secondary font-semibold">{subjects.length} active subjects</span> in database
                </div>
              </div>
            </div>

            {/* Verified Check-Ins */}
            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-start justify-between gap-2 mb-space-md">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold leading-snug min-w-0 flex-1 pr-1 break-words">
                  Verified Check-Ins
                </span>
                <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-[#1F7A4D] shrink-0">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-space-xs flex-wrap">
                  <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                    {analytics ? analytics.present_count : 0}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#39B978]/10 text-[#1F7A4D] font-label-sm text-label-sm font-bold shrink-0">
                    {analytics ? `${analytics.present_rate}% Rate` : "0% Rate"}
                  </span>
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-1 flex items-center gap-1 flex-wrap break-words">
                  <span className="material-symbols-outlined text-[16px] text-[#1F7A4D] shrink-0">trending_up</span>
                  <span className="text-[#1F7A4D] font-semibold">Calculated</span> from real verification logs
                </div>
              </div>
            </div>

            {/* Absent / Unverified */}
            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-start justify-between gap-2 mb-space-md">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold leading-snug min-w-0 flex-1 pr-1 break-words">
                  Absent / Unverified
                </span>
                <div className="w-10 h-10 rounded-xl bg-error-container/30 flex items-center justify-center text-error shrink-0">
                  <span className="material-symbols-outlined text-[20px]">person_off</span>
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-space-xs flex-wrap">
                  <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                    {analytics ? analytics.absent_count : 0}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold shrink-0">
                    {analytics && analytics.total_logs > 0
                      ? `${(100 - analytics.present_rate).toFixed(1)}%`
                      : "0%"}
                  </span>
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-1 break-words">
                  Logged absent or failed verifications
                </div>
              </div>
            </div>

            {/* Accreditation Safety */}
            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-start justify-between gap-2 mb-space-md">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold leading-snug min-w-0 flex-1 pr-1 break-words">
                  Accreditation Safety
                </span>
                <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">query_stats</span>
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-1 flex-wrap">
                  <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                    {analytics ? `${analytics.present_rate}%` : "0%"}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">Min Req: {ATTENDANCE_COMPLIANCE_THRESHOLD}.0%</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      !analytics || analytics.total_logs === 0
                        ? "bg-outline/30"
                        : analytics.present_rate >= ATTENDANCE_COMPLIANCE_THRESHOLD
                        ? "bg-primary-container"
                        : "bg-error"
                    }`}
                    style={{ width: `${Math.min(100, analytics ? analytics.present_rate : 0)}%` }}
                  ></div>
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 flex items-center justify-between gap-1 flex-wrap">
                  <span>Buffer margin:</span>
                  <span
                    className={`font-semibold font-label-sm text-label-sm ${
                      !analytics || analytics.total_logs === 0
                        ? "text-on-surface-variant"
                        : analytics.present_rate >= ATTENDANCE_COMPLIANCE_THRESHOLD
                        ? "text-[#1F7A4D]"
                        : "text-error"
                    }`}
                  >
                    {!analytics || analytics.total_logs === 0
                      ? "—"
                      : `${(analytics.present_rate - ATTENDANCE_COMPLIANCE_THRESHOLD).toFixed(1)}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Visuals & Side Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
            {/* Chart Column */}
            <div className="lg:col-span-8 bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
                <div>
                  <div className="flex items-center gap-space-xs">
                    <h2 className="font-display text-lg md:text-xl font-semibold text-on-surface">
                      Longitudinal Verification Baseline
                    </h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                      Live Database Data
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Class-wide biometric verification vs. {ATTENDANCE_COMPLIANCE_THRESHOLD}% institutional accreditation requirement threshold.
                  </p>
                </div>
              </div>

              <div className="relative w-full h-64 mt-space-sm">{renderTrendChart()}</div>

              <div className="flex flex-wrap items-center justify-between pt-space-md mt-space-sm bg-surface-container-low px-space-md py-space-sm rounded-xl">
                <div className="flex items-center gap-space-md font-body-sm text-body-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary"></span>
                    <span className="text-on-surface font-medium">Actual Verified Rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1 bg-error rounded"></span>
                    <span className="text-on-surface-variant font-medium">Accreditation Floor ({ATTENDANCE_COMPLIANCE_THRESHOLD}%)</span>
                  </div>
                </div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">
                  Timezone: <span className="font-bold text-on-surface">Server UTC</span>
                </div>
              </div>
            </div>

            {/* Right Side Panel */}
            <div className="lg:col-span-4 flex flex-col gap-space-lg">
              {/* Verification Mode Distribution */}
              <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-space-sm">
                  <h2 className="font-display text-lg md:text-xl font-semibold text-on-surface">
                    Verification Mode Distribution
                  </h2>
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">info</span>
                </div>

                <div className="flex items-center gap-space-md my-space-xs">
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-surface-container"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4.2"
                      ></path>
                      {analytics && analytics.mode_distribution.total > 0 && (
                        <>
                          <path
                            className="text-primary"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeDasharray={`${analytics.mode_distribution.face_percentage}, 100`}
                            strokeLinecap="round"
                            strokeWidth="4.2"
                          ></path>
                          <path
                            className="text-secondary-container"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeDasharray={`${analytics.mode_distribution.qr_percentage}, 100`}
                            strokeDashoffset={`-${analytics.mode_distribution.face_percentage}`}
                            strokeLinecap="round"
                            strokeWidth="4.2"
                          ></path>
                        </>
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        {analytics ? analytics.mode_distribution.total : 0}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant -mt-1">Events</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-space-xs flex-1">
                    <div className="flex items-center justify-between font-body-sm text-body-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                        <span className="font-semibold text-on-surface">Face AI</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-on-surface">
                          {analytics ? `${analytics.mode_distribution.face_percentage}%` : "0%"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between font-body-sm text-body-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
                        <span className="font-semibold text-on-surface">Dynamic QR</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-on-surface">
                          {analytics ? `${analytics.mode_distribution.qr_percentage}%` : "0%"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Low Attendance Flagged */}
              <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between flex-1">
                <div className="flex items-center justify-between mb-space-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                      <h2 className="font-display text-lg md:text-xl font-semibold text-on-surface">
                        Low Attendance Flagged
                      </h2>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Below {ATTENDANCE_COMPLIANCE_THRESHOLD}% accreditation threshold</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">
                    {analytics?.low_attendance_students.length || 0} Students
                  </span>
                </div>

                <div className="flex flex-col gap-space-xs my-space-xs">
                  {analytics && analytics.low_attendance_students.length > 0 ? (
                    analytics.low_attendance_students.map((st) => (
                      <div
                        key={st.student_id}
                        className="p-space-xs rounded-xl hover:bg-surface-container-low transition-colors flex items-center justify-between gap-space-xs"
                      >
                        <div className="flex items-center gap-space-xs min-w-0">
                          <div className="w-8 h-8 rounded-full bg-error-container text-error flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {st.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                              {st.name}
                            </span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                              ID: {st.student_id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-label-sm text-label-sm font-bold text-error bg-error-container/40 px-2 py-0.5 rounded">
                            {st.rate}%
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-space-md text-center text-on-surface-variant font-body-sm text-body-sm">
                      No students currently flagged below {ATTENDANCE_COMPLIANCE_THRESHOLD}% attendance threshold.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Audit Trail Table Section */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden mb-space-lg">
            <div className="p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
              <div>
                <h2 className="font-display text-lg md:text-xl font-semibold text-on-surface">
                  Biometric Attendance Audit Trail
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Immutable chronologically sorted logs from existing attendance data.
                </p>
              </div>
              <div className="flex items-center gap-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant hidden sm:inline">
                  Showing {filteredLogs.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}–
                  {Math.min(currentPage * rowsPerPage, filteredLogs.length)} of {filteredLogs.length} records
                </span>
                <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-lowest text-on-surface shadow-xs disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <span className="font-label-sm text-label-sm px-2 font-semibold">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-lowest text-on-surface shadow-xs disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[650px] text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider h-11">
                    <th className="px-space-lg py-2 whitespace-nowrap">Timestamp</th>
                    <th className="px-space-md py-2 whitespace-nowrap">Student</th>
                    <th className="px-space-md py-2 whitespace-nowrap">Subject</th>
                    <th className="px-space-md py-2 whitespace-nowrap">Verification Mode</th>
                    <th className="px-space-md py-2 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0 text-on-surface font-body-sm text-body-sm">
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log) => {
                      const dt = new Date(log.timestamp);
                      const dateFormatted = dt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                      const timeFormatted = dt.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      });

                      return (
                        <tr key={log.log_id} className="h-16 hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-space-lg py-2 whitespace-nowrap font-medium text-on-surface">
                            {dateFormatted}{" "}
                            <span className="text-on-surface-variant font-normal text-xs block">{timeFormatted}</span>
                          </td>
                          <td className="px-space-md py-2 whitespace-nowrap">
                            <div className="flex items-center gap-space-xs">
                              <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs">
                                {(log.student_name || "S").slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-label-md text-label-md font-semibold text-on-surface">
                                  {log.student_name || "Unknown Student"}
                                </span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                                  {log.student_id.slice(0, 8)}...
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-space-md py-2 whitespace-nowrap">
                            <span className="font-semibold text-on-surface block">
                              {log.subject_name || "Subject"}
                            </span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">
                              {log.subject_code || log.subject_id}
                            </span>
                          </td>
                          <td className="px-space-md py-2 whitespace-nowrap">
                            {log.method === "face" ? (
                              <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-semibold">
                                <span className="material-symbols-outlined text-[14px]">videocam</span>
                                AI Face Match
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-secondary-fixed text-primary font-label-sm text-label-sm font-semibold">
                                <span className="material-symbols-outlined text-[14px]">qr_code_scanner</span>
                                Dynamic QR
                              </span>
                            )}
                          </td>
                          <td className="px-space-md py-2 whitespace-nowrap">
                            {log.is_present ? (
                              <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-[#39B978]/12 text-[#1F7A4D] font-label-sm text-label-sm font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#39B978]"></span>
                                PRESENT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                                ABSENT
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-space-xl text-center text-on-surface-variant font-body-md text-body-md">
                        {loading ? "Loading attendance records..." : "No attendance logs found matching current filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-space-md bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
                <span>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-surface-container-lowest px-2 py-1 rounded-lg text-on-surface font-semibold focus:outline-none"
                >
                  <option value={8}>8</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center gap-space-xs">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl bg-surface-container-lowest text-on-surface font-label-sm text-label-sm shadow-xs hover:bg-surface transition-all disabled:opacity-40"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl bg-surface-container-lowest text-on-surface font-label-sm text-label-sm shadow-xs hover:bg-surface transition-all disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-3 py-1.5 rounded-xl bg-primary text-on-primary font-label-sm text-label-sm font-semibold shadow-xs">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 rounded-xl bg-surface-container-lowest text-on-surface font-label-sm text-label-sm shadow-xs hover:bg-surface transition-all disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Footer Accreditation Notice */}
          <div className="p-space-lg rounded-2xl bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-md text-on-surface-variant">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-full bg-secondary-fixed text-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-semibold text-on-surface">
                  Verified Audit Trail & Institutional Compliance
                </span>
                <span className="font-body-sm text-body-sm">
                  All metrics are calculated live from verified attendance records in compliance with institutional requirements.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
