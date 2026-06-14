import {
  CalendarClock,
  CheckCircle2,
  FileQuestion,
  Lock,
  MailX,
  Vote,
} from "lucide-react";

export type VoterStatusVariant =
  | "not_available"
  | "scheduled"
  | "closed"
  | "voted"
  | "invalid_link"
  | "missing_token";

interface VoterStatusScreenProps {
  variant: VoterStatusVariant;
  electionTitle?: string;
  /** ISO date string — shown for the "scheduled" variant. */
  opensAt?: string | null;
}

const CONTENT: Record<
  VoterStatusVariant,
  { icon: typeof Vote; iconClass: string; title: string; message: string }
> = {
  not_available: {
    icon: FileQuestion,
    iconClass: "text-[var(--text-muted)]",
    title: "Not available yet",
    message: "This election has not been opened for voting.",
  },
  scheduled: {
    icon: CalendarClock,
    iconClass: "text-[var(--primary)]",
    title: "Voting hasn't started",
    message: "This election is scheduled to open soon. Check back later.",
  },
  closed: {
    icon: Lock,
    iconClass: "text-[var(--text-muted)]",
    title: "Election closed",
    message: "Voting for this election has ended. Thank you for your interest.",
  },
  voted: {
    icon: CheckCircle2,
    iconClass: "text-[var(--secondary)]",
    title: "You've already voted",
    message: "Your vote has been recorded. Each voter can only vote once.",
  },
  invalid_link: {
    icon: MailX,
    iconClass: "text-[var(--destructive)]",
    title: "Invalid invitation link",
    message:
      "This voting link is invalid or has expired. Please contact the election organizer for a new invitation.",
  },
  missing_token: {
    icon: Lock,
    iconClass: "text-[var(--text-muted)]",
    title: "Invitation required",
    message:
      "This election is protected. You need a personal invitation link sent by the organizer to vote.",
  },
};

export function VoterStatusScreen({
  variant,
  electionTitle,
  opensAt,
}: VoterStatusScreenProps) {
  const { icon: Icon, iconClass, title, message } = CONTENT[variant];

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] mb-6">
        <Icon className={`h-8 w-8 ${iconClass}`} />
      </div>
      {electionTitle && (
        <p className="text-sm font-medium text-[var(--text-muted)] mb-2">
          {electionTitle}
        </p>
      )}
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        {title}
      </h1>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm">
        {message}
        {variant === "scheduled" && opensAt && (
          <>
            <br />
            <span className="font-medium text-[var(--text-primary)]">
              Opens {new Date(opensAt).toLocaleString()}
            </span>
          </>
        )}
      </p>
    </div>
  );
}
