import type { Metadata } from "next";
import RegisterForm from "@/components/RegisterForm";
import PublicHeader from "@/components/PublicHeader";

export const metadata: Metadata = {
  title: "AttendX — Register",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface pt-24 pb-12 flex flex-col items-center justify-center px-4">
      <PublicHeader />
      <RegisterForm />
    </div>
  );
}
