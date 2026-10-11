"use client";

import { useId } from "react";

interface AttendXLogoProps {
  size?: number | string;
  className?: string;
}

export default function AttendXLogo({ size = 40, className = "" }: AttendXLogoProps) {
  const reactId = useId();
  const gradId = `attendx-g-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8A7CF8" />
          <stop offset="1" stopColor="#5442D6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${gradId})`} />
      <path
        d="M16 26V20a4 4 0 0 1 4-4h6M38 16h6a4 4 0 0 1 4 4v6M48 38v6a4 4 0 0 1-4 4h-6M26 48h-6a4 4 0 0 1-4-4v-6"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="32" cy="32" r="9" fill="none" stroke="#fff" strokeWidth="3" />
      <path
        d="M27.5 32.5l3.2 3.2 5.8-6.6"
        fill="none"
        stroke="#FFE45C"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
