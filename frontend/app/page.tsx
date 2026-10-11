import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import AttendXLogo from "@/components/AttendXLogo";

export const metadata: Metadata = {
  title: "AttendX — Smart Attendance. Smarter Classrooms.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <PublicHeader />
      <main className="w-full pt-20 bg-surface min-h-screen">
        <div className="flex flex-col w-full">

          <section className="relative w-full overflow-hidden bg-surface-container-low py-space-xl md:py-24">

            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 opacity-70 blur-3xl pointer-events-none"></div>
            <div className="absolute top-1/2 -right-32 w-[30rem] h-[30rem] rounded-full bg-secondary/10 opacity-60 blur-3xl pointer-events-none"></div>
            <div className="relative max-w-[1680px] mx-auto px-margin md:px-margin-desktop flex flex-col items-center text-center">

              <div className="inline-flex items-center gap-space-xs rounded-full bg-surface-container-lowest px-space-md py-1 shadow-sm mb-space-md">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping"></span>
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Next-Gen Biometric Intelligence</span>
              </div>

              <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface max-w-4xl tracking-tight leading-tight">
                Smart Attendance. <br className="hidden sm:inline"/>
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Smarter Classrooms.</span>
              </h1>

              <p className="mt-space-md font-body-xl text-body-lg md:text-body-xl text-on-surface-variant max-w-2xl">
                AttendX combines AI-powered face recognition and secure dynamic QR attendance to make classroom attendance faster, smarter, and easier to manage.
              </p>

              <div className="mt-space-lg flex flex-wrap items-center justify-center gap-space-md">
                <Link
                  className="inline-flex items-center justify-center font-label-lg text-label-lg text-on-primary bg-primary hover:bg-secondary-container transition-all duration-200 rounded-full px-8 py-3.5 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
                  href="/register"
                >
                  Get Started →
                </Link>
                <a className="inline-flex items-center justify-center font-label-lg text-label-lg text-primary bg-surface-container-lowest hover:bg-surface-container transition-all duration-200 rounded-full px-8 py-3.5 shadow-sm" href="#how-it-works">
                  Explore How It Works
                </a>
              </div>

              <div className="relative w-full max-w-6xl mt-12 md:mt-16 bg-surface-container-lowest rounded-3xl shadow-xl shadow-primary/10 overflow-hidden">

                <div className="w-full bg-surface-container px-space-md md:px-space-lg py-3 flex flex-wrap items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <span className="w-3 h-3 rounded-full bg-error inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-secondary-container inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-secondary inline-block"></span>
                    <div className="ml-space-sm flex items-center gap-2 text-on-surface">
                      <span className="material-symbols-outlined text-primary text-[20px]">school</span>
                      <span className="font-headline-sm text-headline-sm font-semibold truncate">CS302: Neural Networks &amp; Deep Learning • Hall B4 • Prof. Davis</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest px-3 py-1 font-label-sm text-label-sm text-on-surface">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                      98.2% Accuracy
                    </span>
                    <span className="font-label-sm text-label-sm text-on-primary bg-primary px-3 py-1 rounded-full">Live Session</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 p-space-md md:p-space-lg gap-gutter bg-surface-bright">

                  <div className="lg:col-span-7 relative min-h-[340px] md:min-h-[420px] rounded-2xl overflow-hidden bg-inverse-surface flex flex-col justify-between p-space-md shadow-inner">
<img className="absolute inset-0 w-full h-full object-cover opacity-60" data-alt="Modern university amphitheater lecture hall with undergraduate engineering students attentively seated across tiered desks, subtle lavender ambient studio lighting and soft atmospheric daylight through high architectural windows." src="/images/classroom.svg"/>

<div className="relative z-10 flex items-center justify-between">
<div className="inline-flex items-center gap-2 rounded-full bg-inverse-surface/80 backdrop-blur-md px-3 py-1.5 text-inverse-on-surface font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[16px] text-secondary-fixed">videocam</span>
                Podium Camera 01 • 4K Spatial Sensor
              </div>
<div className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 font-label-sm text-label-sm text-on-surface">
<span className="material-symbols-outlined text-[16px] text-primary">face</span>
                DeepFace Engine Active
              </div>
</div>

<div className="relative z-10 w-full h-full my-auto flex items-center justify-center">

<div className="absolute top-12 left-10 p-2 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-md">
<div className="flex items-center gap-1.5">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span className="font-label-sm text-label-sm text-on-surface font-bold">Liam Chen (98%)</span>
</div>
</div>

<div className="absolute top-28 right-16 p-2 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-md">
<div className="flex items-center gap-1.5">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span className="font-label-sm text-label-sm text-on-surface font-bold">Sophia Martinez (96%)</span>
</div>
</div>

<div className="absolute bottom-16 left-28 p-2 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-md">
<div className="flex items-center gap-1.5">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span className="font-label-sm text-label-sm text-on-surface font-bold">Maya Patel (94%)</span>
</div>
</div>

<div className="absolute bottom-8 right-24 p-2 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-md">
<div className="flex items-center gap-1.5">
<span className="w-2 h-2 rounded-full bg-secondary-container"></span>
<span className="font-label-sm text-label-sm text-on-surface font-bold">Marcus Vance (89%)</span>
</div>
</div>
</div>

<div className="relative z-10 flex items-center justify-between bg-inverse-surface/85 backdrop-blur-md rounded-xl p-space-sm text-inverse-on-surface">
<span className="font-label-sm text-label-sm">Frame: 00:14:28 • Snapshot Batch #4</span>
<span className="font-label-sm text-label-sm text-secondary-fixed">Continuous Liveness Verified</span>
</div>
</div>

<div className="lg:col-span-5 flex flex-col gap-space-md">

<div className="p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
<div>
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider">Attendance Rate</span>
<h3 className="font-display-md text-display-md text-on-surface mt-1">91.4%</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">45 Present • 4 Absent • 1 Flagged</p>
</div>
<div className="relative w-20 h-20 flex items-center justify-center">
<svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
<path className="text-surface-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
<path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="91.4, 100" strokeLinecap="round" strokeWidth="3.5"></path>
</svg>
<span className="absolute font-headline-sm text-headline-sm text-on-surface font-bold">91%</span>
</div>
</div>

<div className="p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm flex items-center gap-space-md">
<div className="relative w-24 h-24 shrink-0 bg-surface-container rounded-xl p-2 flex items-center justify-center">

<svg className="w-full h-full text-primary" fill="currentColor" viewBox="0 0 100 100">
<rect height="24" rx="4" width="24" x="10" y="10"></rect>
<rect fill="white" height="16" width="16" x="14" y="14"></rect>
<rect height="8" width="8" x="18" y="18"></rect>
<rect height="24" rx="4" width="24" x="66" y="10"></rect>
<rect fill="white" height="16" width="16" x="70" y="14"></rect>
<rect height="8" width="8" x="74" y="18"></rect>
<rect height="24" rx="4" width="24" x="10" y="66"></rect>
<rect fill="white" height="16" width="16" x="14" y="70"></rect>
<rect height="8" width="8" x="18" y="74"></rect>
<rect height="8" width="8" x="42" y="14"></rect>
<rect height="8" width="8" x="42" y="30"></rect>
<rect height="8" width="8" x="52" y="22"></rect>
<rect height="16" width="8" x="42" y="66"></rect>
<rect height="8" width="16" x="66" y="44"></rect>
<rect height="8" width="8" x="66" y="60"></rect>
<rect height="12" width="12" x="78" y="68"></rect>
</svg>
<div className="absolute -bottom-2 -right-2 bg-primary text-on-primary font-label-sm text-label-sm px-2 py-0.5 rounded-full shadow">
                  24s
                </div>
</div>
<div>
<div className="flex items-center gap-1.5 mb-1">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span className="font-label-sm text-label-sm uppercase text-secondary font-bold">Dynamic Token QR</span>
</div>
<h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Anti-Proxy Rotating Code</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Rotates automatically every 30s. Geo-proximity active.</p>
</div>
</div>

<div className="p-space-md rounded-2xl bg-surface-container-low flex flex-col gap-2">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Live Check-in Stream</span>
<div className="flex items-center justify-between text-on-surface bg-surface-container-lowest px-3 py-2 rounded-xl shadow-xs">
<span className="font-body-sm text-body-sm">Elena Rostova • CS-2024-089</span>
<span className="font-label-sm text-label-sm text-primary font-bold">Matched via Face (99.1%)</span>
</div>
<div className="flex items-center justify-between text-on-surface bg-surface-container-lowest px-3 py-2 rounded-xl shadow-xs">
<span className="font-body-sm text-body-sm">Devon Brooks • CS-2024-042</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">Verified via QR (Token #7A)</span>
</div>
</div>
</div>
</div>

<div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm p-space-md bg-surface-container-high">
<div className="bg-surface-container-lowest p-3 rounded-xl flex items-center gap-2 shadow-sm">
<span className="text-xl">🎯</span>
<div>
<span className="block font-headline-sm text-headline-sm text-on-surface font-bold">48 Faces</span>
<span className="block font-label-sm text-label-sm text-on-surface-variant">Detected in Frame</span>
</div>
</div>
<div className="bg-surface-container-lowest p-3 rounded-xl flex items-center gap-2 shadow-sm">
<span className="text-xl">⚡</span>
<div>
<span className="block font-headline-sm text-headline-sm text-on-surface font-bold">45 Matched</span>
<span className="block font-label-sm text-label-sm text-on-surface-variant">In &lt;2.8 Seconds</span>
</div>
</div>
<div className="bg-surface-container-lowest p-3 rounded-xl flex items-center gap-2 shadow-sm">
<span className="text-xl">✨</span>
<div>
<span className="block font-headline-sm text-headline-sm text-on-surface font-bold">94% Confidence</span>
<span className="block font-label-sm text-label-sm text-on-surface-variant">Average Match Index</span>
</div>
</div>
<div className="bg-surface-container-lowest p-3 rounded-xl flex items-center gap-2 shadow-sm">
<span className="text-xl">🔄</span>
<div>
<span className="block font-headline-sm text-headline-sm text-on-surface font-bold">QR Active</span>
<span className="block font-label-sm text-label-sm text-on-surface-variant">10s Sync Refresh</span>
</div>
</div>
</div>
</div>
</div>
</section>

<section className="w-full py-space-xl md:py-24 bg-surface" id="features">
<div className="max-w-[1680px] mx-auto px-margin md:px-margin-desktop">

<div className="text-center max-w-3xl mx-auto mb-16">
<span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest bg-surface-container px-3 py-1 rounded-full">
          PLATFORM CAPABILITIES
        </span>
<h2 className="font-headline-xl md:font-display-md text-headline-xl md:text-display-md text-on-surface mt-3">
          Everything you need for smarter attendance
        </h2>
<p className="font-body-lg text-body-lg text-on-surface-variant mt-3">
          Built specifically to eradicate proxy attendance, save 15+ minutes per lecture, and deliver actionable academic insights.
        </p>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">

<div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary mb- space-md">
<span className="material-symbols-outlined text-2xl">center_focus_strong</span>
</div>
<div className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 font-label-sm text-label-sm text-primary mb-2">
              DeepFace + OpenCV
            </div>
<h3 className="font-headline-md text-headline-md text-on-surface font-bold">AI Face Recognition</h3>
<p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Detect and match multiple students from a single classroom photograph in under 3 seconds with high neural confidence.
            </p>
</div>
<div className="mt-6 pt-4 bg-surface-container-low rounded-xl p-3 flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface font-semibold">Max Classroom Size</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">120+ Students/Shot</span>
</div>
</div>

<div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary mb-space-md">
<span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
</div>
<div className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 font-label-sm text-label-sm text-secondary mb-2">
              Crypto-Signed Tokens
            </div>
<h3 className="font-headline-md text-headline-md text-on-surface font-bold">Dynamic QR Attendance</h3>
<p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Time-limited QR codes refresh automatically every 15–30s with cryptographic tokens to eliminate proxy code sharing.
            </p>
</div>
<div className="mt-6 pt-4 bg-surface-container-low rounded-xl p-3 flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface font-semibold">Screenshot Proof</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">15s Expiry Loop</span>
</div>
</div>

<div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary mb-space-md">
<span className="material-symbols-outlined text-2xl">verified_user</span>
</div>
<div className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 font-label-sm text-label-sm text-primary mb-2">
              Dual-Layer Security
            </div>
<h3 className="font-headline-md text-headline-md text-on-surface font-bold">Hybrid Verification</h3>
<p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Combine QR scanning with instant student face verification to confirm physical classroom presence beyond any doubt.
            </p>
</div>
<div className="mt-6 pt-4 bg-surface-container-low rounded-xl p-3 flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface font-semibold">Spoof Detection</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">Liveness Certified</span>
</div>
</div>

<div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary mb-space-md">
<span className="material-symbols-outlined text-2xl">insights</span>
</div>
<div className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 font-label-sm text-label-sm text-primary mb-2">
              Predictive Tracking
            </div>
<h3 className="font-headline-md text-headline-md text-on-surface font-bold">Real-Time Analytics</h3>
<p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Track attendance percentages, absence trends, semester eligibility, and automatic debarment warnings seamlessly.
            </p>
</div>
<div className="mt-6 pt-4 bg-surface-container-low rounded-xl p-3 flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface font-semibold">Automated Alerts</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">&lt;75% Attendance Warn</span>
</div>
</div>

<div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary mb-space-md">
<span className="material-symbols-outlined text-2xl">rule_settings</span>
</div>
<div className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 font-label-sm text-label-sm text-secondary mb-2">
              Human In The Loop
            </div>
<h3 className="font-headline-md text-headline-md text-on-surface font-bold">Manual Verification</h3>
<p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Teachers maintain full control. Review AI match confidence scores and easily correct ambiguous results in one click.
            </p>
</div>
<div className="mt-6 pt-4 bg-surface-container-low rounded-xl p-3 flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface font-semibold">Teacher Authority</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">1-Click Manual Override</span>
</div>
</div>

<div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary mb-space-md">
<span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
</div>
<div className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 font-label-sm text-label-sm text-primary mb-2">
              LMS &amp; ERP Ready
            </div>
<h3 className="font-headline-md text-headline-md text-on-surface font-bold">Secure Management</h3>
<p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Role-based student and teacher portals with encrypted attendance records and automated LMS export capabilities.
            </p>
</div>
<div className="mt-6 pt-4 bg-surface-container-low rounded-xl p-3 flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface font-semibold">Integrations</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">Canvas, Moodle, BlackBoard</span>
</div>
</div>
</div>
</div>
</section>

<section className="w-full py-space-xl md:py-24 bg-surface-container-low" id="how-it-works">
<div className="max-w-[1680px] mx-auto px-margin md:px-margin-desktop">

<div className="text-center max-w-3xl mx-auto mb-16">
<span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest bg-surface-container-lowest px-3 py-1 rounded-full shadow-xs">
          STREAMLINED WORKFLOW
        </span>
<h2 className="font-headline-xl md:font-display-md text-headline-xl md:text-display-md text-on-surface mt-3">
          From classroom photo to attendance in seconds
        </h2>
<p className="font-body-lg text-body-lg text-on-surface-variant mt-3">
          A seamless seven-step pipeline engineered for frictionless classroom operations.
        </p>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">

<div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-4">
<span className="font-label-lg text-label-lg font-bold text-secondary">STEP 01</span>
<span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-label-sm text-label-sm font-bold text-on-surface">1</span>
</div>
<h4 className="font-headline-md text-headline-md text-on-surface font-bold">Student Registration</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Students capture 3–5 sample face angles with instant embedding generation.
            </p>
</div>

<div className="mt-6 pt-4 bg-surface-container-low rounded-xl p-3 flex justify-between gap-1">
<div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs">✓</div>
<div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs">✓</div>
<div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs">✓</div>
<div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant text-xs">Vector</div>
</div>
</div>

<div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-4">
<span className="font-label-lg text-label-lg font-bold text-secondary">STEP 02</span>
<span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-label-sm text-label-sm font-bold text-on-surface">2</span>
</div>
<h4 className="font-headline-md text-headline-md text-on-surface font-bold">Join Subject</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Students scan a teacher's subject QR or input a 6-digit lecture code.
            </p>
</div>

<div className="mt-6 pt-4 bg-surface-container-low rounded-xl p-2.5 flex items-center justify-between">
<span className="font-label-sm text-label-sm font-bold text-primary bg-surface-container-lowest px-2.5 py-1 rounded-md">CS-302</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">• Enrolled</span>
</div>
</div>

<div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-4">
<span className="font-label-lg text-label-lg font-bold text-secondary">STEP 03</span>
<span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-label-sm text-label-sm font-bold text-on-surface">3</span>
</div>
<h4 className="font-headline-md text-headline-md text-on-surface font-bold">Start Attendance</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Faculty launches lecture session and picks 'AI Face Snapshot' or 'Dynamic QR'.
            </p>
</div>

<div className="mt-6 pt-4 bg-surface-container-low rounded-xl p-2 flex gap-1">
<button className="w-1/2 py-1 text-center bg-primary text-on-primary rounded-lg font-label-sm text-label-sm font-bold">AI Snapshot</button>
<button className="w-1/2 py-1 text-center bg-surface-container text-on-surface rounded-lg font-label-sm text-label-sm">QR Code</button>
</div>
</div>

<div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-4">
<span className="font-label-lg text-label-lg font-bold text-secondary">STEP 04</span>
<span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-label-sm text-label-sm font-bold text-on-surface">4</span>
</div>
<h4 className="font-headline-md text-headline-md text-on-surface font-bold">AI Face Recognition</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Single wide classroom snapshot is processed via neural embeddings in parallel.
            </p>
</div>

<div className="mt-6 pt-4 bg-surface-container-low rounded-xl p-2.5 flex items-center justify-between text-on-surface">
<span className="font-label-sm text-label-sm">52 Faces Detected</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">99.2% Match</span>
</div>
</div>

<div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-4">
<span className="font-label-lg text-label-lg font-bold text-secondary">STEP 05</span>
<span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-label-sm text-label-sm font-bold text-on-surface">5</span>
</div>
<h4 className="font-headline-md text-headline-md text-on-surface font-bold">QR Verification</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Students scan the live projector QR on their mobile device with geo-proximity.
            </p>
</div>

<div className="mt-6 pt-4 bg-surface-container-low rounded-xl p-2.5 flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface">Geo-Radius Match</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">Hall B4 • Verified</span>
</div>
</div>

<div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-4">
<span className="font-label-lg text-label-lg font-bold text-secondary">STEP 06</span>
<span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-label-sm text-label-sm font-bold text-on-surface">6</span>
</div>
<h4 className="font-headline-md text-headline-md text-on-surface font-bold">Review &amp; Confirm</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Faculty reviews confidence badges (Green &gt;90%, Amber 70-89%) and confirms roll.
            </p>
</div>

<div className="mt-6 pt-4 bg-surface-container-low rounded-xl p-2 flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface font-semibold">1 Ambiguous</span>
<button className="bg-primary text-on-primary px-3 py-1 rounded-lg font-label-sm text-label-sm font-bold shadow-xs">Approve All</button>
</div>
</div>

<div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between md:col-span-2 lg:col-span-2">
<div>
<div className="flex items-center justify-between mb-4">
<span className="font-label-lg text-label-lg font-bold text-secondary">STEP 07</span>
<span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-label-sm text-label-sm font-bold text-on-surface">7</span>
</div>
<h4 className="font-headline-md text-headline-md text-on-surface font-bold">Attendance Analytics &amp; Export</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Real-time records push to institutional databases, student portals, and exportable PDF/Excel rosters.
            </p>
</div>

<div className="mt-6 pt-4 bg-surface-container-low rounded-xl p-3 flex items-center justify-between gap-4">
<div className="flex items-end gap-1.5 h-8">
<div className="w-3 bg-secondary-fixed rounded-t h-4"></div>
<div className="w-3 bg-secondary-fixed rounded-t h-6"></div>
<div className="w-3 bg-secondary rounded-t h-8"></div>
<div className="w-3 bg-primary rounded-t h-7"></div>
</div>
<span className="font-label-sm text-label-sm text-on-surface">Export: <strong>CSV • XLSX • PDF</strong></span>
</div>
</div>
</div>
</div>
</section>

<section className="w-full py-space-xl md:py-24 bg-surface">
<div className="max-w-[1680px] mx-auto px-margin md:px-margin-desktop">

<div className="text-center max-w-4xl mx-auto mb-16">
<span className="font-label-sm text-label-sm text-primary uppercase tracking-widest bg-primary-fixed px-4 py-1.5 rounded-full font-bold">
          ONE PLATFORM. TWO INTELLIGENT WAYS TO RECORD ATTENDANCE.
        </span>
<h2 className="font-headline-xl md:font-display-md text-headline-xl md:text-display-md text-on-surface mt-4">
          Engineered for high-density auditoriums &amp; modern labs
        </h2>
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">

<div className="bg-surface-container-low p-space-lg md:p-space-xl rounded-3xl flex flex-col justify-between">
<div>
<div className="inline-flex items-center gap-2 bg-surface-container px-3 py-1 rounded-full font-label-sm text-label-sm text-primary mb-4 font-bold">
              📸 AI Group Face Attendance
            </div>
<h3 className="font-headline-xl text-headline-xl text-on-surface font-bold">
              Instant roll call for large lecture halls
            </h3>
<p className="font-body-md text-body-md text-on-surface-variant mt-3">
              Take one group photo from the podium and let AttendX identify the entire class in seconds, eliminating manual headcounts.
            </p>
</div>

<div className="relative mt-8 rounded-2xl overflow-hidden bg-inverse-surface aspect-video flex flex-col justify-between p-4 shadow-lg">
<img className="absolute inset-0 w-full h-full object-cover opacity-50" data-alt="Expansive academic lecture auditorium viewed from instructor podium perspective, rows of attentive students looking ahead, soft bright educational indoor lighting with distinct sharp focal clarity." src="/images/classroom.svg"/>
<div className="relative z-10 flex justify-between">
<span className="bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full font-label-sm text-label-sm text-on-surface font-bold">
                Live Viewfinder
              </span>
<span className="bg-primary text-on-primary px-3 py-1 rounded-full font-label-sm text-label-sm font-bold">
                +52 Verified
              </span>
</div>

<div className="relative z-10 grid grid-cols-3 gap-2 my-auto">
<div className="bg-surface-container-lowest/90 backdrop-blur-sm p-2 rounded-xl text-center shadow">
<span className="block font-label-sm text-label-sm font-bold text-on-surface">Alex Rivera</span>
<span className="block text-[10px] text-secondary font-bold">99% Match</span>
</div>
<div className="bg-surface-container-lowest/90 backdrop-blur-sm p-2 rounded-xl text-center shadow">
<span className="block font-label-sm text-label-sm font-bold text-on-surface">Chloe Bennett</span>
<span className="block text-[10px] text-secondary font-bold">97% Match</span>
</div>
<div className="bg-surface-container-lowest/90 backdrop-blur-sm p-2 rounded-xl text-center shadow">
<span className="block font-label-sm text-label-sm font-bold text-on-surface">David Kim</span>
<span className="block text-[10px] text-secondary font-bold">93% Match</span>
</div>
</div>
<div className="relative z-10 flex justify-between items-center text-inverse-on-surface text-[11px]">
<span>Resolution: 3840x2160 • PyTorch Model</span>
<span className="text-secondary-fixed">FaceNet v2 Inference</span>
</div>
</div>
</div>

<div className="bg-surface-container-low p-space-lg md:p-space-xl rounded-3xl flex flex-col justify-between">
<div>
<div className="inline-flex items-center gap-2 bg-surface-container px-3 py-1 rounded-full font-label-sm text-label-sm text-secondary mb-4 font-bold">
              ⚡ Dynamic Anti-Cheat QR
            </div>
<h3 className="font-headline-xl text-headline-xl text-on-surface font-bold">
              Projected on screen or faculty tablet
            </h3>
<p className="font-body-md text-body-md text-on-surface-variant mt-3">
              Auto-regenerating cryptographic QR with active countdown preventing code screenshot sharing and remote proxy attendance.
            </p>
</div>

<div className="mt-8 rounded-2xl bg-surface-container-lowest p-6 flex flex-col items-center justify-center shadow-lg">

<div className="relative p-4 bg-surface-bright rounded-2xl shadow-inner">
<svg className="w-36 h-36 text-on-surface" fill="currentColor" viewBox="0 0 120 120">
<rect height="30" rx="4" width="30" x="10" y="10"></rect>
<rect fill="white" height="20" width="20" x="15" y="15"></rect>
<rect height="10" width="10" x="20" y="20"></rect>
<rect height="30" rx="4" width="30" x="80" y="10"></rect>
<rect fill="white" height="20" width="20" x="85" y="15"></rect>
<rect height="10" width="10" x="90" y="20"></rect>
<rect height="30" rx="4" width="30" x="10" y="80"></rect>
<rect fill="white" height="20" width="20" x="15" y="85"></rect>
<rect height="10" width="10" x="20" y="90"></rect>
<rect height="10" width="10" x="50" y="20"></rect>
<rect height="8" width="8" x="65" y="30"></rect>
<rect height="20" width="12" x="50" y="80"></rect>
<rect height="10" width="20" x="80" y="55"></rect>
<rect height="10" width="10" x="80" y="80"></rect>
<rect height="15" width="15" x="95" y="85"></rect>
</svg>
</div>

<div className="w-full max-w-xs mt-4 flex flex-col items-center">
<div className="flex items-center justify-between w-full font-label-sm text-label-sm text-on-surface-variant mb-1">
<span>Rotating Token Validity</span>
<span className="font-bold text-secondary">Refresh in 12s</span>
</div>
<div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
<div className="bg-secondary h-2 rounded-full w-2/3 transition-all"></div>
</div>
</div>

<div className="w-full mt-4 bg-surface-container-low p-3 rounded-xl flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
<span className="font-label-sm text-label-sm text-on-surface">Just checked in: <strong>Sarah K., Ryan M.</strong></span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Now</span>
</div>
</div>
</div>
</div>
</div>
</section>

<section className="w-full py-space-xl md:py-24 bg-surface-container-low">
<div className="max-w-[1680px] mx-auto px-margin md:px-margin-desktop">

<div className="text-center max-w-3xl mx-auto mb-16">
<span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest bg-surface-container-lowest px-3 py-1 rounded-full shadow-xs">
          TAILORED EXPERIENCES
        </span>
<h2 className="font-headline-xl md:font-display-md text-headline-xl md:text-display-md text-on-surface mt-3">
          Built for both sides of the classroom
        </h2>
<p className="font-body-lg text-body-lg text-on-surface-variant mt-3">
          Intuitive administrative controls for professors and seamless self-service for enrolled students.
        </p>
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">

<div className="bg-surface-container-lowest p-space-lg md:p-space-xl rounded-3xl shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center gap-space-sm mb-4">
<span className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary">
<span className="material-symbols-outlined text-xl">co_present</span>
</span>
<div>
<h3 className="font-headline-xl text-headline-xl text-on-surface font-bold">Faculty &amp; Admin Workspace</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">Effortless session management, automated rolls, and student tracking.</p>
</div>
</div>

<div className="flex flex-wrap gap-1.5 my-6">
<span className="bg-primary text-on-primary font-label-sm text-label-sm px-3 py-1 rounded-full">Dashboard</span>
<span className="bg-surface-container font-label-sm text-label-sm text-on-surface px-3 py-1 rounded-full">Take Attendance</span>
<span className="bg-surface-container font-label-sm text-label-sm text-on-surface px-3 py-1 rounded-full">Manage Subjects</span>
<span className="bg-surface-container font-label-sm text-label-sm text-on-surface px-3 py-1 rounded-full">Live Sessions</span>
<span className="bg-surface-container font-label-sm text-label-sm text-on-surface px-3 py-1 rounded-full">Student Directory</span>
<span className="bg-surface-container font-label-sm text-label-sm text-on-surface px-3 py-1 rounded-full">Reports &amp; Audit</span>
<span className="bg-surface-container font-label-sm text-label-sm text-on-surface px-3 py-1 rounded-full">Analytics</span>
</div>

<div className="bg-surface-container-low rounded-2xl p-space-md flex flex-col gap-3">
<div className="flex items-center justify-between">
<span className="font-headline-sm text-headline-sm font-semibold text-on-surface">Active Courses (Fall 2025)</span>
<button className="bg-primary text-on-primary px-3 py-1.5 rounded-full font-label-sm text-label-sm font-bold shadow-sm">
                  Launch Live Session
                </button>
</div>

<div className="bg-surface-container-lowest p-3 rounded-xl flex items-center justify-between shadow-xs">
<div>
<h5 className="font-headline-sm text-headline-sm font-bold text-on-surface">CS302 • Neural Networks</h5>
<span className="font-body-sm text-body-sm text-on-surface-variant">Hall B4 • 48 Enrolled</span>
</div>
<div className="text-right">
<span className="font-label-sm text-label-sm text-secondary font-bold block">94.2% Avg Roll</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Last: Today 10:00 AM</span>
</div>
</div>

<div className="bg-surface-container-lowest p-3 rounded-xl flex items-center justify-between shadow-xs">
<div>
<h5 className="font-headline-sm text-headline-sm font-bold text-on-surface">CS401 • Distributed Systems</h5>
<span className="font-body-sm text-body-sm text-on-surface-variant">Auditorium 2 • 92 Enrolled</span>
</div>
<div className="text-right">
<span className="font-label-sm text-label-sm text-secondary font-bold block">89.6% Avg Roll</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Last: Yesterday</span>
</div>
</div>
</div>
</div>
<div className="mt-8 pt-4 flex items-center justify-between text-on-surface-variant">
<span className="font-body-sm text-body-sm">• Comprehensive export formats (CSV, XLS, PDF)</span>
<a className="font-label-sm text-label-sm text-primary font-bold hover:underline" href="#">Explore Faculty Portal →</a>
</div>
</div>

<div className="bg-surface-container-lowest p-space-lg md:p-space-xl rounded-3xl shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center gap-space-sm mb-4">
<span className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-on-secondary">
<span className="material-symbols-outlined text-xl">person_pin</span>
</span>
<div>
<h3 className="font-headline-xl text-headline-xl text-on-surface font-bold">Student Self-Service Portal</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">Transparent attendance records, instant QR check-in, and verification.</p>
</div>
</div>

<div className="flex flex-wrap gap-1.5 my-6">
<span className="bg-secondary text-on-secondary font-label-sm text-label-sm px-3 py-1 rounded-full">Student Dashboard</span>
<span className="bg-surface-container font-label-sm text-label-sm text-on-surface px-3 py-1 rounded-full">My Enrolled Subjects</span>
<span className="bg-surface-container font-label-sm text-label-sm text-on-surface px-3 py-1 rounded-full">Join Subject Code</span>
<span className="bg-surface-container font-label-sm text-label-sm text-on-surface px-3 py-1 rounded-full">Instant QR Scanner</span>
<span className="bg-surface-container font-label-sm text-label-sm text-on-surface px-3 py-1 rounded-full">Face Profile</span>
<span className="bg-surface-container font-label-sm text-label-sm text-on-surface px-3 py-1 rounded-full">History &amp; Appeal</span>
</div>

<div className="bg-surface-container-low rounded-2xl p-space-md flex flex-col gap-3">
<div className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between shadow-xs">
<div>
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Overall Semester Attendance</span>
<div className="flex items-baseline gap-2 mt-1">
<span className="font-display-md text-display-md font-bold text-on-surface">94.6%</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">Safe from Debarment</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Minimum requirement: 75.0%</span>
</div>
<div className="w-14 h-14 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary font-bold text-lg">
                  95%
                </div>
</div>

<div className="bg-surface-container-lowest p-3 rounded-xl flex items-center justify-between shadow-xs">
<div>
<span className="font-label-sm text-label-sm text-secondary font-bold">Next Lecture: 11:30 AM</span>
<h5 className="font-headline-sm text-headline-sm font-bold text-on-surface">CS302: Neural Networks</h5>
</div>
<button className="bg-secondary text-on-secondary px-4 py-2 rounded-full font-label-sm text-label-sm font-bold flex items-center gap-1.5 shadow-sm">
<span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                  Scan Lecture QR
                </button>
</div>
</div>
</div>
<div className="mt-8 pt-4 flex items-center justify-between text-on-surface-variant">
<span className="font-body-sm text-body-sm">• Mobile &amp; tablet optimized progressive web app</span>
<a className="font-label-sm text-label-sm text-secondary font-bold hover:underline" href="#">Explore Student App →</a>
</div>
</div>
</div>
</div>
</section>

<section className="w-full py-space-xl md:py-24 bg-inverse-surface text-inverse-on-surface" id="technology">
<div className="max-w-[1680px] mx-auto px-margin md:px-margin-desktop">

<div className="text-center max-w-3xl mx-auto mb-16">
<span className="font-label-sm text-label-sm text-secondary-fixed uppercase tracking-widest bg-surface-container-lowest/10 px-3 py-1 rounded-full">
          SYSTEM ARCHITECTURE
        </span>
<h2 className="font-headline-xl md:font-display-md text-headline-xl md:text-display-md text-surface mt-3">
          Powered by modern technology
        </h2>
<p className="font-body-lg text-body-lg text-outline-variant mt-3">
          Built on high-performance deep learning models and enterprise cloud infrastructure for instantaneous verification.
        </p>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">

<div className="bg-surface-container-lowest/5 p-space-lg rounded-2xl backdrop-blur-sm hover:bg-surface-container-lowest/10 transition-colors">
<div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary mb-4">
<span className="material-symbols-outlined text-xl">terminal</span>
</div>
<h4 className="font-headline-md text-headline-md text-surface font-bold">Python</h4>
<p className="font-body-sm text-body-sm text-outline-variant mt-1">Core AI backend, batch feature vector calculations, and neural model inference engine.</p>
</div>

<div className="bg-surface-container-lowest/5 p-space-lg rounded-2xl backdrop-blur-sm hover:bg-surface-container-lowest/10 transition-colors">
<div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-on-secondary mb-4">
<span className="material-symbols-outlined text-xl">bolt</span>
</div>
<h4 className="font-headline-md text-headline-md text-surface font-bold">FastAPI</h4>
<p className="font-body-sm text-body-sm text-outline-variant mt-1">High-throughput asynchronous attendance streaming with sub-50ms API endpoints.</p>
</div>

<div className="bg-surface-container-lowest/5 p-space-lg rounded-2xl backdrop-blur-sm hover:bg-surface-container-lowest/10 transition-colors">
<div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface mb-4">
<span className="material-symbols-outlined text-xl">layers</span>
</div>
<h4 className="font-headline-md text-headline-md text-surface font-bold">Next.js</h4>
<p className="font-body-sm text-body-sm text-outline-variant mt-1">Server-side rendered institutional portals, static optimization, and fluid navigation.</p>
</div>

<div className="bg-surface-container-lowest/5 p-space-lg rounded-2xl backdrop-blur-sm hover:bg-surface-container-lowest/10 transition-colors">
<div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary mb-4">
<span className="material-symbols-outlined text-xl">widgets</span>
</div>
<h4 className="font-headline-md text-headline-md text-surface font-bold">React</h4>
<p className="font-body-sm text-body-sm text-outline-variant mt-1">Dynamic interactive dashboards, state-driven real-time video canvases, and rosters.</p>
</div>

<div className="bg-surface-container-lowest/5 p-space-lg rounded-2xl backdrop-blur-sm hover:bg-surface-container-lowest/10 transition-colors">
<div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-on-secondary mb-4">
<span className="material-symbols-outlined text-xl">psychology</span>
</div>
<h4 className="font-headline-md text-headline-md text-surface font-bold">FaceNet • Deep Learning</h4>
<p className="font-body-sm text-body-sm text-outline-variant mt-1">99.4% biometric feature matching accuracy across varied lighting and orientations.</p>
</div>

<div className="bg-surface-container-lowest/5 p-space-lg rounded-2xl backdrop-blur-sm hover:bg-surface-container-lowest/10 transition-colors">
<div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface mb-4">
<span className="material-symbols-outlined text-xl">visibility</span>
</div>
<h4 className="font-headline-md text-headline-md text-surface font-bold">OpenCV</h4>
<p className="font-body-sm text-body-sm text-outline-variant mt-1">Computer vision preprocessing, real-time bounding box extraction, and liveness checks.</p>
</div>

<div className="bg-surface-container-lowest/5 p-space-lg rounded-2xl backdrop-blur-sm hover:bg-surface-container-lowest/10 transition-colors">
<div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary mb-4">
<span className="material-symbols-outlined text-xl">database</span>
</div>
<h4 className="font-headline-md text-headline-md text-surface font-bold">PostgreSQL</h4>
<p className="font-body-sm text-body-sm text-outline-variant mt-1">Relational schema design with robust audit logs, roll histories, and pgvector search.</p>
</div>

<div className="bg-surface-container-lowest/5 p-space-lg rounded-2xl backdrop-blur-sm hover:bg-surface-container-lowest/10 transition-colors">
<div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-on-secondary mb-4">
<span className="material-symbols-outlined text-xl">lock</span>
</div>
<h4 className="font-headline-md text-headline-md text-surface font-bold">JWT Authentication</h4>
<p className="font-body-sm text-body-sm text-outline-variant mt-1">Cryptographically signed user sessions with strict role-based policy enforcement.</p>
</div>

<div className="bg-surface-container-lowest/5 p-space-lg rounded-2xl backdrop-blur-sm hover:bg-surface-container-lowest/10 transition-colors">
<div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface mb-4">
<span className="material-symbols-outlined text-xl">cached</span>
</div>
<h4 className="font-headline-md text-headline-md text-surface font-bold">Dynamic QR Engine</h4>
<p className="font-body-sm text-body-sm text-outline-variant mt-1">Time-based one-time tokens with short expiration cycles to ensure physical presence.</p>
</div>
</div>
</div>
</section>

<section className="w-full py-space-xl md:py-24 bg-surface" id="why-attendx">
<div className="max-w-[1680px] mx-auto px-margin md:px-margin-desktop">

<div className="text-center max-w-3xl mx-auto mb-16">
<span className="font-label-sm text-label-sm text-primary uppercase tracking-widest bg-surface-container px-3 py-1 rounded-full">
          THE ATTENDX ADVANTAGE
        </span>
<h2 className="font-headline-xl md:font-display-md text-headline-xl md:text-display-md text-on-surface mt-3">
          Designed to transform collegiate operations
        </h2>
</div>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">

<div className="bg-surface-container-low p-space-lg md:p-space-xl rounded-3xl flex flex-col justify-between shadow-sm">
<div>
<span className="font-display-lg text-display-lg font-extrabold text-primary block leading-none mb-4">01</span>
<h3 className="font-headline-xl text-headline-xl text-on-surface font-bold">One classroom photo</h3>
<p className="font-body-lg text-body-lg text-on-surface-variant mt-4">
              Detect up to 100+ students simultaneously in a single wide snapshot, saving up to 20 minutes per class session and recovering crucial instructional time.
            </p>
</div>
<div className="mt-8 pt-6 bg-surface-container-lowest p-4 rounded-2xl">
<span className="font-label-sm text-label-sm text-secondary font-bold block uppercase">Time Recovered</span>
<span className="font-headline-md text-headline-md text-on-surface font-semibold">15–20 Mins Saved Per Lecture</span>
</div>
</div>

<div className="bg-surface-container-low p-space-lg md:p-space-xl rounded-3xl flex flex-col justify-between shadow-sm">
<div>
<span className="font-display-lg text-display-lg font-extrabold text-secondary block leading-none mb-4">02</span>
<h3 className="font-headline-xl text-headline-xl text-on-surface font-bold">Secure QR sessions</h3>
<p className="font-body-lg text-body-lg text-on-surface-variant mt-4">
              Time-limited, encrypted rotating QR codes eliminate proxy attendance and unauthorized remote check-ins through geo-proximity fencing.
            </p>
</div>
<div className="mt-8 pt-6 bg-surface-container-lowest p-4 rounded-2xl">
<span className="font-label-sm text-label-sm text-secondary font-bold block uppercase">Proxy Elimination</span>
<span className="font-headline-md text-headline-md text-on-surface font-semibold">100% Verified Physical Presence</span>
</div>
</div>

<div className="bg-surface-container-low p-space-lg md:p-space-xl rounded-3xl flex flex-col justify-between shadow-sm">
<div>
<span className="font-display-lg text-display-lg font-extrabold text-primary-container block leading-none mb-4">03</span>
<h3 className="font-headline-xl text-headline-xl text-on-surface font-bold">Teacher-controlled AI</h3>
<p className="font-body-lg text-body-lg text-on-surface-variant mt-4">
              AI assists and automates the heavy lifting while intuitive manual review keeps the final attendance authority strictly in faculty hands.
            </p>
</div>
<div className="mt-8 pt-6 bg-surface-container-lowest p-4 rounded-2xl">
<span className="font-label-sm text-label-sm text-secondary font-bold block uppercase">Governance</span>
<span className="font-headline-md text-headline-md text-on-surface font-semibold">Zero Unsupervised Decisions</span>
</div>
</div>
</div>
</div>
</section>

<section className="w-full py-space-xl md:py-24 bg-surface">
<div className="max-w-[1680px] mx-auto px-margin md:px-margin-desktop">
<div className="relative bg-gradient-to-br from-primary via-primary-container to-secondary rounded-3xl p-space-lg md:p-20 text-center overflow-hidden shadow-2xl">

<div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-secondary-fixed opacity-30 blur-2xl pointer-events-none"></div>
<div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-surface-bright opacity-20 blur-2xl pointer-events-none"></div>
<div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
<span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest/15 backdrop-blur-md px-4 py-1 font-label-sm text-label-sm text-surface tracking-wider uppercase mb-4">
            TRANSFORM YOUR INSTITUTION
          </span>
<h2 className="font-headline-xl md:font-display-md text-headline-xl md:text-display-md text-on-primary font-extrabold tracking-tight">
            Ready to make attendance smarter?
          </h2>
<p className="mt-space-md font-body-lg md:font-body-xl text-body-lg md:text-body-xl text-primary-fixed max-w-xl">
            Experience AI-powered classroom attendance with AttendX. Built for modern educators and ambitious students.
          </p>
<div className="mt-space-lg flex flex-wrap items-center justify-center gap-space-md">
<a className="inline-flex items-center justify-center font-label-lg text-label-lg text-primary bg-surface-container-lowest hover:bg-surface-bright transition-all duration-200 rounded-full px-8 py-3.5 shadow-lg hover:shadow-xl hover:-translate-y-0.5" data-path="register" href="#">
              Create Free Account
            </a>
<a className="inline-flex items-center justify-center font-label-lg text-label-lg text-on-primary bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 backdrop-blur-md transition-all duration-200 rounded-full px-8 py-3.5" data-path="login" href="#">
              Explore Demo Portal
            </a>
</div>
</div>
</div>
</div>
</section>
</div></main><footer className="w-full bg-surface-container-low py-space-xl"><div className="max-w-[1680px] mx-auto px-margin md:px-margin-desktop"><div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-gutter pb-space-lg"><div className="flex flex-col gap-space-xs"><div className="flex items-center gap-space-sm"><AttendXLogo size={28} /><span className="font-headline-sm text-headline-sm text-on-surface font-bold">AttendX</span></div><p className="font-body-md text-body-md text-on-surface-variant">Smart Attendance. Smarter Classrooms.</p><span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">AI-powered Face + QR Attendance System</span></div><nav className="flex flex-wrap items-center gap-x-space-lg gap-y-space-sm" data-active-classes="text-primary font-bold"><a aria-current="page" className="transition-colors text-primary font-bold" data-path="home" href="#">Home</a><a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors" data-path="features" href="#">Features</a><a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors" data-path="how-it-works" href="#">How It Works</a><a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors" data-path="technology" href="#">Technology</a><a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors" data-path="why-attendx" href="#">Why AttendX</a><a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors" data-path="login" href="#">Login</a><a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors" data-path="register" href="#">Register</a></nav></div><div className="pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm"><p className="font-body-sm text-body-sm text-on-surface-variant">© 2025 AttendX Biometric Systems Inc. All rights reserved.</p><div className="inline-flex items-center gap-space-xs rounded-full bg-surface-container px-space-md py-space-xs"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span><span className="font-label-sm text-label-sm text-on-surface">System Operational • 99.98% Accuracy</span></div></div></div></footer>
    </div>
  );
}
