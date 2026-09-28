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
  enrolled_count?: number;
}

export default function SubjectsClient() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedQrSubject, setSelectedQrSubject] = useState<{
    subject: Subject;
    qr_code: string;
  } | null>(null);

  // Form inputs
  const [newName, setNewName] = useState("");
  const [newSection, setNewSection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/subjects");
      if (!res.ok) throw new Error("Failed to fetch subjects.");
      const data = await res.json();
      setSubjects(data.subjects || []);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading subjects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          section: newSection || "Sec A",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create subject.");
      }

      const data = await res.json();
      setNewName("");
      setNewSection("");
      setIsCreateModalOpen(false);

      // Auto-open QR badge modal for the newly created subject
      if (data.subject && data.qr_code) {
        setSelectedQrSubject({
          subject: data.subject,
          qr_code: data.qr_code,
        });
      }

      // Refresh real list
      fetchSubjects();
    } catch (err: any) {
      setError(err.message || "Failed to create subject.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenQrModal = async (subject: Subject) => {
    try {
      const res = await fetch(`/api/subjects/${subject.subject_id}/qr`);
      if (!res.ok) throw new Error("Failed to load QR code.");
      const data = await res.json();
      setSelectedQrSubject({
        subject,
        qr_code: data.qr_code,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load QR code.");
    }
  };

  return (
    <div className="p-space-lg md:p-space-xl max-w-[1600px] mx-auto">
      {/* Top Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-xl">
        <div>
          <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">
            Manage Subjects &amp; Courses
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Create, configure, and monitor course rosters for biometric attendance tracking.
          </p>
        </div>

        {/* Trigger Button to Open Modal */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-space-xs px-space-lg py-space-sm bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-md"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Create New Subject</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-space-lg p-4 rounded-xl bg-error-container text-error font-body-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSubjects} className="underline font-semibold ml-4">
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="p-12 text-center text-outline font-body-md animate-pulse bg-surface p-space-lg rounded-2xl border border-outline-variant/30">
          Loading active subjects from backend database...
        </div>
      ) : subjects.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-surface p-space-lg rounded-2xl border border-outline-variant/30 flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-[48px] text-outline">menu_book</span>
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface">No subjects created yet</h3>
          <p className="text-body-md text-on-surface-variant max-w-md">
            Click "+ Create New Subject" to generate unique course join codes and static QR enrollment badges.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-2 px-space-lg py-space-sm bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-md"
          >
            + Create New Subject
          </button>
        </div>
      ) : (
        /* Subjects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
          {subjects.map((sub) => (
            <div
              key={sub.subject_id}
              className="bg-surface p-space-lg rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="px-space-sm py-0.5 bg-primary-container/40 text-primary text-label-md font-bold rounded-lg uppercase">
                    {sub.subject_code}
                  </span>
                  <span className="text-label-sm font-semibold text-emerald-600 bg-emerald-50 px-space-xs py-0.5 rounded-full">
                    Active Roster
                  </span>
                </div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-space-xs">
                  {sub.name}
                </h2>
                <p className="text-body-sm text-on-surface-variant mb-space-md">
                  Section: {sub.section}
                </p>

                <div className="flex flex-col gap-space-xs border-t border-outline-variant/20 pt-space-sm text-body-sm text-on-surface-variant">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-[18px]">group</span>
                    <span>Enrolled Students: <strong className="text-on-surface font-semibold">{sub.enrolled_count ?? 0}</strong></span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-[18px]">key</span>
                    <span>Join Code: <strong className="text-on-surface font-mono">{sub.subject_code}</strong></span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-[18px]">fingerprint</span>
                    <span>ID: <span className="font-mono text-[12px]">{sub.subject_id}</span></span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    <span>Created: {new Date(sub.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-space-sm mt-space-md pt-space-sm border-t border-outline-variant/20">
                <Link
                  href="/teacher/attendance"
                  className="flex-1 text-center py-space-xs bg-primary-container/30 text-primary font-semibold text-body-sm rounded-lg hover:bg-primary-container/50 transition-colors"
                >
                  Take Attendance
                </Link>
                <button
                  type="button"
                  onClick={() => handleOpenQrModal(sub)}
                  className="px-3 py-space-xs bg-surface-container-high hover:bg-secondary hover:text-on-secondary text-on-surface font-semibold text-body-sm rounded-lg transition-colors flex items-center gap-1"
                  title="View QR Code"
                >
                  <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                  <span>QR</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Subject Modal Dialog */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-space-md">
          <div className="w-full max-w-lg bg-surface p-space-xl rounded-2xl border border-outline-variant/40 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-space-lg pb-space-xs border-b border-outline-variant/20">
              <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                Create New Subject
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-space-xs text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="flex flex-col gap-space-md">
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-space-xs">
                  Subject Title
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Neural Networks &amp; Deep Learning"
                  className="w-full px-space-md py-space-sm bg-surface-container-low border border-outline-variant/40 rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-space-xs">
                  Section / Batch Code
                </label>
                <input
                  type="text"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  placeholder="e.g. CS501-A"
                  className="w-full px-space-md py-space-sm bg-surface-container-low border border-outline-variant/40 rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-space-sm mt-space-md pt-space-sm border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-space-lg py-space-sm border border-outline-variant/40 text-on-surface-variant font-semibold rounded-xl hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-space-lg py-space-sm bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Save Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal Dialog */}
      {selectedQrSubject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-space-md">
          <div className="w-full max-w-md bg-surface p-space-xl rounded-2xl border border-outline-variant/40 shadow-2xl flex flex-col items-center gap-space-md animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                Static Enrollment QR
              </h3>
              <button
                onClick={() => setSelectedQrSubject(null)}
                className="p-space-xs text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="text-center">
              <h4 className="font-headline-sm font-bold text-on-surface">{selectedQrSubject.subject.name}</h4>
              <p className="text-body-sm text-on-surface-variant">Section: {selectedQrSubject.subject.section}</p>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-inner border border-outline-variant/30 flex items-center justify-center">
              <img
                src={selectedQrSubject.qr_code}
                alt={`QR code for ${selectedQrSubject.subject.name}`}
                className="w-56 h-56 object-contain"
              />
            </div>

            <div className="w-full p-3 bg-surface-container-low rounded-xl text-center">
              <span className="text-label-sm text-outline uppercase tracking-wider block font-semibold">
                Static Join Code
              </span>
              <span className="text-headline-md font-bold font-mono text-primary tracking-widest">
                {selectedQrSubject.subject.subject_code}
              </span>
            </div>

            <button
              onClick={() => setSelectedQrSubject(null)}
              className="w-full py-space-sm bg-surface-container-high text-on-surface font-semibold rounded-xl hover:bg-surface-container-highest transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
