import Link from "next/link";
import AttendXLogo from "@/components/AttendXLogo";

export default function PublicHeader() {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(75,62,180,0.06)]">
      <div className="h-20 max-w-[1680px] mx-auto px-margin md:px-margin-desktop flex items-center justify-between gap-gutter">
        <Link href="/" className="flex items-center gap-space-md">
          <AttendXLogo size={32} />
          <span className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface">
            AttendX
          </span>
        </Link>
        <nav className="hidden lg:flex items-center gap-space-lg">
          <Link
            href="/#features"
            className="text-body-md font-medium text-on-surface-variant hover:text-primary transition-colors"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-body-md font-medium text-on-surface-variant hover:text-primary transition-colors"
          >
            How it Works
          </Link>
          <Link
            href="/#security"
            className="text-body-md font-medium text-on-surface-variant hover:text-primary transition-colors"
          >
            Security & Biometrics
          </Link>
        </nav>
        <div className="flex items-center gap-space-sm">
          <Link
            href="/login"
            className="px-space-md py-space-sm text-body-md font-semibold text-primary hover:bg-primary-container/20 rounded-lg transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-space-lg py-space-sm text-body-md font-semibold text-on-primary bg-primary hover:bg-primary/90 rounded-lg shadow-md transition-all"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </header>
  );
}
