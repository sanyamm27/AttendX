import type { Metadata } from "next";
import ReportsClient from "@/components/ReportsClient";

export const metadata: Metadata = {
  title: "AttendX — Attendance Reports",
};

export default function ReportsPage() {
  return <ReportsClient />;
}
