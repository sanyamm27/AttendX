import type { Metadata } from "next";
import StudentSettingsClient from "@/components/StudentSettingsClient";

export const metadata: Metadata = {
  title: "AttendX — Student Settings",
};

export default function StudentSettingsPage() {
  return <StudentSettingsClient />;
}
