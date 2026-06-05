import Link from "next/link";
import { Vote, AlertTriangle, ShieldOff, ServerCrash, HelpCircle } from "lucide-react";

// NextAuth passes the error type as a query param: /error?error=AccessDenied
type ErrorType =
  | "AccessDenied"
  | "Configuration"
  | "Verification"
  | "OAuthSignin"
  | "OAuthCallback"
  | "Default";

const ERROR_MAP: Record<ErrorType, { icon: React.ElementType; title: string; description: string }> = {
  AccessDenied: {
    icon: ShieldOff,
    title: "Access denied",
    description:
      "Your account doesn't have permission to sign in. Contact your administrator if you believe this is a mistake.",
  },
  Configuration: {
    icon: ServerCrash,
    title: "Server configuration error",
    description:
      "There's a problem with the server configuration. Please try again later or contact support.",
  },
  Verification: {
    icon: AlertTriangle,
    title: "Verification failed",
    description:
      "The sign-in link is no longer valid. It may have already been used or expired.",
  },
  OAuthSignin: {
    icon: AlertTriangle,
    title: "Sign-in error",
    description:
      "Something went wrong while starting the sign-in flow. Please try again.",
  },
  OAuthCallback: {
    icon: AlertTriangle,
    title: "Callback error",
    description:
      "Something went wrong during the Google sign-in callback. Please try again.",
  },
  Default: {
    icon: HelpCircle,
    title: "Authentication error",
    description:
      "An unexpected error occurred during sign-in. Please try again or contact support.",
  },
};

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function AuthErrorPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const key = (error as ErrorType) in ERROR_MAP ? (error as ErrorType) : "Default";
  const { icon: Icon, title, description } = ERROR_MAP[key];

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-[var(--destructive)] opacity-[0.04] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-[var(--primary)] opacity-[0.05] blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-md">
              <Vote className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-wide text-[var(--text-primary)]">
              Nomina
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl p-8 text-center">
          {/* Error icon */}
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--destructive-light)] mb-6">
            <Icon className="h-8 w-8 text-[var(--destructive)]" />
          </div>

          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-3">
            {title}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2">
            {description}
          </p>

          {/* Error code badge */}
          {error && (
            <div className="inline-block mt-1 mb-6 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-mono text-[var(--text-muted)]">
              error: {error}
            </div>
          )}
          {!error && <div className="mb-6" />}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] shadow-sm transition-all active:scale-[0.98]"
            >
              Try signing in again
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-all"
            >
              Back to home
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} Kymera Technologies
        </p>
      </div>
    </div>
  );
}
