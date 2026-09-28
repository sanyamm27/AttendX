import type { Metadata } from "next";
import TeacherDashboardClient from "@/components/TeacherDashboardClient";

export const metadata: Metadata = {
  title: "AttendX — Teacher Dashboard",
};

export default function TeacherDashboardPage() {
  return <TeacherDashboardClient />;
}
