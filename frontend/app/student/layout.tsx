import StudentSidebar from "@/components/StudentSidebar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <StudentSidebar />
      <main className="pl-0 md:pl-72 min-h-screen">{children}</main>
    </div>
  );
}
