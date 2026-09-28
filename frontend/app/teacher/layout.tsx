import FacultySidebar from "@/components/FacultySidebar";

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <FacultySidebar />
      <main className="pl-0 md:pl-72 min-h-screen">{children}</main>
    </div>
  );
}
