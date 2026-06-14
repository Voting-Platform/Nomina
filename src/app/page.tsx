import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import Link from "next/link";
import {
  Vote,
  Clock,
  Users,
  BarChart3,
  Share2,
  Copy,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Zap,
  Lock,
  Settings2,
} from "lucide-react";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: Settings2,
    title: "Vote Limits Per Candidate",
    description:
      "Cap exactly how many votes each candidate can receive — impossible in Google Forms. Prevent runaway results and ensure balanced representation.",
    highlight: true,
  },
  {
    icon: Users,
    title: "Flexible Voter Base",
    description:
      "Open to anyone with a link, or lock it to specific email addresses or whole email domains. You decide who participates.",
  },
  {
    icon: Clock,
    title: "Automated Scheduling",
    description:
      "Set a start and end time to auto-open and auto-close your election, or manage it manually — whichever fits your workflow.",
  },
  {
    icon: BarChart3,
    title: "Live Results & CSV Export",
    description:
      "Watch ranked results update in real time with vote counts, percentages, and a full voter activity log you can export as CSV.",
  },
  {
    icon: Share2,
    title: "Secure Sharing",
    description:
      "Generate a unique shareable link or send direct email invitations to voters — all from one place without leaving the platform.",
  },
  {
    icon: Copy,
    title: "Duplicate Elections",
    description:
      "Running a recurring vote? Clone any past election with one click and start fresh without rebuilding the whole setup from scratch.",
  },
];

const COMPARISONS = [
  { feature: "Limit votes per candidate", googleForms: false, nomina: true },
  { feature: "Set max votes per voter", googleForms: false, nomina: true },
  { feature: "Per-candidate eligibility rules", googleForms: false, nomina: true },
  { feature: "Restrict voters by email or domain", googleForms: false, nomina: true },
  { feature: "Auto-schedule open & close", googleForms: false, nomina: true },
  { feature: "Live ranked results", googleForms: false, nomina: true },
  { feature: "Export results as CSV", googleForms: "partial", nomina: true },
  { feature: "Candidate photos & profiles", googleForms: false, nomina: true },
];

const STEPS = [
  {
    number: "01",
    title: "Create your election",
    description:
      "Name it, add a description, then build out your candidate list with photos and profiles.",
  },
  {
    number: "02",
    title: "Set the rules",
    description:
      "Configure max votes per voter, per candidate, voter restrictions, and scheduling mode.",
  },
  {
    number: "03",
    title: "Share & collect votes",
    description:
      "Send the link or invite voters by email. Watch results update live as votes come in.",
  },
];

// SVG fill doesn't support CSS variables — colors are hardcoded intentionally
function GoogleIconLight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="rgba(255,255,255,0.9)" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="rgba(255,255,255,0.9)" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="rgba(255,255,255,0.9)" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="rgba(255,255,255,0.9)" />
    </svg>
  );
}

function GoogleIconDark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#6C5CE7" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#6C5CE7" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#6C5CE7" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#6C5CE7" />
    </svg>
  );
}

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
              <Vote className="h-4 w-4" />
            </span>
            <span className="font-semibold tracking-wide text-[var(--text-primary)]">
              Nomina
            </span>
          </Link>

          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] shadow-sm"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-[var(--primary)] opacity-[0.06] blur-3xl" />
          <div className="absolute top-24 right-0 h-[400px] w-[400px] rounded-full bg-[var(--secondary)] opacity-[0.05] blur-3xl" />
          <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-[var(--accent)] opacity-[0.04] blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-20 pb-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary-light)] px-3.5 py-1.5 text-xs font-medium text-[var(--primary)] mb-8">
            <Zap className="h-3 w-3" />
            The upgrade Google Forms never got
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight max-w-4xl mx-auto">
            Voting with{" "}
            <span className="text-[var(--primary)]">precise control</span>
            <br className="hidden sm:block" />
            {" "}over every vote
          </h1>

          {/* Sub-headline */}
          <p className="mt-6 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Nomina does what Google Forms can&apos;t — cap votes per candidate, restrict
            who can vote, auto-schedule elections, and track live ranked results.
            Built for elections, not surveys.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <form action={signInWithGoogle}>
              <button
                type="submit"
                className="inline-flex items-center gap-2.5 rounded-[var(--radius-md)] bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] shadow-md"
              >
                <GoogleIconLight className="h-4 w-4" />
                Continue with Google
              </button>
            </form>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
            >
              See all features
            </a>
          </div>

          {/* Quick capability strip */}
          <div className="mt-16 inline-flex flex-col sm:flex-row items-stretch gap-px rounded-xl border border-[var(--border)] bg-[var(--border)] overflow-hidden shadow-sm">
            {[
              { value: "Per-candidate", label: "vote caps" },
              { value: "3 modes", label: "voter access control" },
              { value: "Auto", label: "open & close scheduling" },
              { value: "CSV", label: "results export" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="flex-1 bg-[var(--surface)] px-6 py-4 text-center min-w-[130px]"
              >
                <div className="text-sm font-bold text-[var(--primary)]">{value}</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5 whitespace-nowrap">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ─────────────────────────────────────────────── */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">
              What Google Forms can&apos;t do
            </h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              Google Forms handles surveys. Nomina handles elections.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full max-w-2xl mx-auto text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left pb-3 pr-4 font-medium text-[var(--text-secondary)] w-1/2">
                    Feature
                  </th>
                  <th className="text-center pb-3 px-4 font-medium text-[var(--text-secondary)] w-1/4">
                    Google Forms
                  </th>
                  <th className="text-center pb-3 px-4 font-semibold text-[var(--primary)] w-1/4">
                    Nomina
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {COMPARISONS.map(({ feature, googleForms, nomina }) => (
                  <tr
                    key={feature}
                    className="hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <td className="py-3 pr-4 text-[var(--text-primary)]">{feature}</td>
                    <td className="py-3 text-center px-4">
                      {googleForms === "partial" ? (
                        <span className="text-xs text-[var(--text-muted)] italic">
                          manual only
                        </span>
                      ) : googleForms ? (
                        <CheckCircle2 className="h-5 w-5 text-[var(--success)] mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-[var(--destructive)] mx-auto opacity-70" />
                      )}
                    </td>
                    <td className="py-3 text-center px-4">
                      {nomina ? (
                        <CheckCircle2 className="h-5 w-5 text-[var(--success)] mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-[var(--destructive)] mx-auto opacity-70" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────────── */}
      <section id="features" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Built for real-world elections
            </h2>
            <p className="mt-3 text-[var(--text-secondary)] max-w-xl mx-auto">
              Every feature answers one question: what does a fair, controlled election
              actually need?
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, description, highlight }) => (
              <div
                key={title}
                className={`rounded-xl border p-6 transition-all hover:shadow-md ${
                  highlight
                    ? "border-[var(--primary)]/40 bg-[var(--primary-light)]"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg mb-4 ${
                    highlight
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface-hover)] text-[var(--primary)]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {highlight && (
                  <div className="mb-2">
                    <span className="inline-block text-xs font-semibold text-[var(--primary)] bg-[var(--primary)]/10 rounded-full px-2.5 py-0.5">
                      Key differentiator
                    </span>
                  </div>
                )}

                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold">Up and running in minutes</h2>
            <p className="mt-3 text-[var(--text-secondary)]">
              No setup overwhelm — three steps and your election is live.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {STEPS.map(({ number, title, description }, idx) => (
              <div key={number} className="relative text-center">
                {/* Connector line between steps */}
                {idx < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-[calc(50%+28px)] right-[-50%] h-px bg-[var(--border)]" />
                )}
                <div className="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--primary)] bg-[var(--primary-light)] font-bold text-[var(--primary)] mb-4">
                  {number}
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24">
          <div className="relative overflow-hidden rounded-2xl bg-[var(--primary)] px-8 py-16 text-center">
            {/* Decorative glows inside the CTA card */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white opacity-[0.06] blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[var(--secondary)] opacity-30 blur-3xl" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/10 mb-5">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Take control of your next vote
              </h2>
              <p className="text-white/70 max-w-md mx-auto mb-8 leading-relaxed">
                Sign in with Google and create your first election in under 2 minutes.
                Free to use. No credit card required.
              </p>
              <form action={signInWithGoogle}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2.5 rounded-[var(--radius-md)] bg-white px-6 py-3 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary-light)] shadow-lg"
                >
                  <GoogleIconDark className="h-4 w-4" />
                  Get started with Google
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-[var(--primary)] text-white">
              <Vote className="h-3 w-3" />
            </span>
            <span className="text-sm font-medium text-[var(--text-secondary)]">Nomina</span>
          </Link>
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} Kymera Technologies. Built for fair elections.
          </p>
        </div>
      </footer>

    </div>
  );
}
