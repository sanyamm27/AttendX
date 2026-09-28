import type { Metadata } from "next";
import SubjectsClient from "@/components/SubjectsClient";

export const metadata: Metadata = {
  title: "AttendX — Manage Subjects",
};

export default function ManageSubjectsPage() {
  return (
    <SubjectsClient />
  );
}
