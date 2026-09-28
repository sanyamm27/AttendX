import type { Metadata } from "next";
import StudentDashboardClient from "@/components/StudentDashboardClient";

export const metadata: Metadata = {
  title: "AttendX — Student Dashboard",
};

export default function StudentDashboardPage() {
  return <StudentDashboardClient />;
}
