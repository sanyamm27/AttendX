"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TeacherUser {
  id: string;
  name: string;
  username: string;
  role: string;
}

export default function TeacherSettingsClient() {
  const router = useRouter();
  const [user, setUser] = useState<TeacherUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Editable form fields
  const [name, setName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

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
        if (!data.authenticated || !data.user || data.user.role !== "teacher") {
          setErrorMsg("Unauthorized teacher access.");
          setLoading(false);
          return;
        }

        setUser(data.user);
        setName(data.user.name || "");
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setErrorMsg(null);

      const payload: { name?: string; password?: string } = {};
      if (name && name !== user?.name) payload.name = name;
      if (password) payload.password = password;

      if (Object.keys(payload).length === 0) {
        showToast("No changes to save.");
        setIsSaving(false);
        return;
      }

      const res = await fetch("/api/auth/teacher/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update profile.");
      }

      const data = await res.json();
      setUser({
        ...user!,
        name: data.teacher.name,
      });
      setPassword("");
      showToast("Profile & credentials updated successfully!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
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
        {/* Navigation Sticky Subheader */}
        <div className="sticky top-16 z-30 bg-surface/90 backdrop-blur-md px-gutter py-space-sm flex flex-col md:flex-row md:items-center justify-between gap-space-sm shadow-sm">
          <div className="flex items-center gap-space-xs text-body-sm font-body-sm text-outline">
            <span className="hover:text-primary transition-colors cursor-pointer">Academics</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Account</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface font-label-md">Profile & Settings</span>
          </div>

          <nav className="flex items-center gap-space-xs overflow-x-auto py-1">
            <a
              className="px-space-md py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-label-md transition-all shadow-sm hover:opacity-90 flex items-center gap-1.5"
              href="#section-profile"
            >
              <span className="material-symbols-outlined text-[16px]">account_circle</span>
              <span>Profile</span>
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
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                  Faculty Portal
                </span>
                <span className="flex items-center gap-1 text-secondary font-label-sm text-label-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  Session Active
                </span>
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
                Faculty Account Settings
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl mt-1">
                Manage your instructor credentials, update profile details, and handle session security.
              </p>
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
              <span className="font-label-lg text-label-lg font-semibold">Loading faculty profile...</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-space-md rounded-xl bg-error-container text-on-error-container flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span className="font-body-sm text-body-sm flex-1">{errorMsg}</span>
            </div>
          )}

          {/* Main Profile Content */}
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
                      <h2 className="font-display text-lg md:text-xl font-semibold text-on-surface">
                        Faculty Profile Information
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Update instructor name and security credentials
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-space-md p-space-md bg-surface-container-low rounded-xl">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-2xl shadow-sm">
                      {(user?.name || "P").slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-start text-center sm:text-left flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-space-xs">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        {user?.name || "Professor"}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-outline-variant mt-0.5">
                      Faculty Member • @{user?.username || "faculty"}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="flex flex-col gap-space-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-on-surface flex items-center justify-between font-semibold">
                        <span>Full Instructor Name</span>
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-outline">
                          badge
                        </span>
                        <input
                          className="w-full bg-surface-container-low pl-10 pr-3 py-2.5 rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-on-surface flex items-center justify-between font-semibold">
                        <span>Username / Login Handle</span>
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-outline">
                          alternate_email
                        </span>
                        <input
                          disabled
                          className="w-full bg-surface-container-high/60 text-on-surface-variant/80 pl-10 pr-3 py-2.5 rounded-xl font-body-md text-body-md font-mono cursor-not-allowed select-none"
                          type="text"
                          value={user?.username || ""}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="font-label-md text-label-md text-on-surface flex items-center justify-between font-semibold">
                        <span>New Password (Leave blank to keep current)</span>
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-outline">
                          lock
                        </span>
                        <input
                          className="w-full bg-surface-container-low pl-10 pr-3 py-2.5 rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30"
                          type="password"
                          placeholder="••••••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-space-sm border-t border-outline-variant/20">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-space-xl py-2.5 bg-primary text-on-primary font-bold rounded-full shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                    </button>
                  </div>
                </form>
              </section>
            </div>

            {/* Right Column: Active Session & Sign Out */}
            <div className="xl:col-span-5 flex flex-col gap-space-xl">
              <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-9 h-9 rounded-xl bg-error-container text-error flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">lock_clock</span>
                  </div>
                  <div>
                    <h2 className="font-display text-lg md:text-xl font-semibold text-on-surface">
                      Active Session & Sign Out
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Manage session security and exit
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
                        Active Teacher Session ({user?.username})
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
