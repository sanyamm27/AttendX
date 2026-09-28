import type { Metadata } from "next";
import TeacherSettingsClient from "@/components/TeacherSettingsClient";

export const metadata: Metadata = {
  title: "AttendX — Faculty Settings",
};

export default function FacultySettingsPage() {
  return <TeacherSettingsClient />;
}
