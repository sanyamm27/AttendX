import type { Metadata } from "next";
import StudentJoinClient from "@/components/StudentJoinClient";

export const metadata: Metadata = {
  title: "AttendX — Join Subject",
};

export default function JoinSubjectPage() {
  return <StudentJoinClient />;
}
