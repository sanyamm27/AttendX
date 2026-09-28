import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";
import PublicHeader from "@/components/PublicHeader";

export const metadata: Metadata = {
  title: "AttendX — Login",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface pt-24 pb-12 flex flex-col items-center justify-center px-4">
      <PublicHeader />
      <LoginForm />
    </div>
  );
}
