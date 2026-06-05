import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { Vote, ShieldCheck, BarChart3, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const HIGHLIGHTS = [
  { icon: ShieldCheck, text: "Controlled voter access" },
  { icon: BarChart3,   text: "Live ranked results"     },
  { icon: Users,       text: "Per-candidate vote caps" },
];

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="rgba(255,255,255,0.9)" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="rgba(255,255,255,0.9)" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="rgba(255,255,255,0.9)" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="rgba(255,255,255,0.9)" />
    </svg>
  );
}

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-[var(--primary)] opacity-[0.07] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[350px] w-[350px] rounded-full bg-[var(--secondary)] opacity-[0.05] blur-3xl" />
        <div className="absolute top-1/2 left-0 h-[300px] w-[300px] rounded-full bg-[var(--accent)] opacity-[0.04] blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-md">
              <Vote className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-wide text-[var(--text-primary)]">
              Nomina
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Sign in to Nomina
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Create and manage elections with precise control over every vote.
            </p>
          </div>

          {/* Highlights */}
          <div className="mb-8 space-y-2.5">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 rounded-lg bg-[var(--surface-hover)] px-4 py-2.5"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--primary-light)] text-[var(--primary)]">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm text-[var(--text-secondary)]">{text}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[var(--surface)] px-3 text-xs text-[var(--text-muted)]">
                continue with
              </span>
            </div>
          </div>

          {/* Google sign-in button */}
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-3 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <GoogleIcon className="h-4 w-4 shrink-0" />
              Continue with Google
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[var(--text-muted)] leading-relaxed">
            By signing in you agree to our terms of service.
            <br />
            Nomina is free to use. No credit card required.
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} Kymera Technologies
        </p>
      </div>
    </div>
  );
}
