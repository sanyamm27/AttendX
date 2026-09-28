import type { Metadata } from "next";
import AttendanceClient from "@/components/AttendanceClient";

export const metadata: Metadata = {
  title: "AttendX — Take Attendance",
};

export default function TakeAttendancePage() {
  return (
    <AttendanceClient />
  );
}
