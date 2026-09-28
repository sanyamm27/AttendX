"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface AuthUser {
  name: string;
  username?: string;
  role: string;
}

export default function FacultySidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const navItems = [
    {
      name: "Dashboard",
      href: "/teacher/dashboard",
      icon: "space_dashboard",
    },
    {
      name: "Take Attendance",
      href: "/teacher/attendance",
      icon: "camera_front",
    },
    {
      name: "Manage Subjects",
      href: "/teacher/subjects",
      icon: "menu_book",
    },
    {
      name: "Attendance Reports",
      href: "/teacher/reports",
      icon: "analytics",
    },
    {
      name: "Settings",
      href: "/teacher/settings",
      icon: "settings",
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-inverse-surface z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-20 px-space-lg flex items-center gap-space-sm bg-inverse-surface">
          <img
            alt="AttendX Logo"
            className="h-8 w-auto object-contain"
            src="/images/logo.svg"
          />
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md text-inverse-on-surface font-bold tracking-tight">
              AttendX
            </span>
            <span className="font-label-sm text-label-sm text-outline-variant tracking-wider uppercase font-semibold">
              Faculty Portal
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-space-xs p-space-md">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-space-md px-space-md py-space-sm rounded-xl text-body-md transition-all ${
                  isActive
                    ? "bg-primary text-on-primary font-semibold shadow-sm"
                    : "text-surface-variant hover:bg-surface-container-highest/20 hover:text-surface-bright"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Faculty Profile Footer */}
      <div className="p-space-md border-t border-outline-variant/20">
        <div className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-highest/10">
          <div className="flex items-center gap-space-sm min-w-0">
            <img
              alt="Professor Avatar"
              className="h-10 w-10 rounded-full object-cover border border-outline-variant/30 shrink-0"
              src="/images/avatar.svg"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-label-lg text-label-lg text-inverse-on-surface font-semibold truncate">
                {user?.name || "Faculty"}
              </span>
              <span className="font-label-sm text-label-sm text-outline-variant truncate">
                {user?.username ? `@${user.username}` : "Faculty Portal"}
              </span>
            </div>
          </div>
          <Link
            href="/login"
            className="p-space-xs text-outline-variant hover:text-error transition-colors shrink-0"
            title="Sign Out"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
