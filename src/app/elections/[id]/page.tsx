import { getElectionById } from "@/actions/election/get-election-by-id";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/atoms/status-badge";
import { StatCard } from "@/components/atoms/stat-card";
import { Badge } from "@/components/atoms/badge";
import { Separator } from "@/components/atoms/separator";
import { Users, Vote, Eye, Calendar, Clock, Globe, Mail, AtSign } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const VOTER_ICON_MAP: Record<string, LucideIcon> = {
  anyone_with_link: Globe,
  restricted_emails: Mail,
  restricted_domain: AtSign,
};

export default async function ElectionOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const election = await getElectionById(id).catch(() => notFound());

  const voterModeLabel: Record<string, string> = {
    anyone_with_link: "Anyone with link",
    restricted_emails: `${election.allowedVoterEmails?.length || 0} emails`,
    restricted_domain: `@${election.allowedVoterDomains?.[0] || "domain"}`,
  };

  const VoterIcon: LucideIcon = VOTER_ICON_MAP[election.voterBaseMode] || Globe;

  return (
    <div className="space-y-6">
      {/* Status + key stats */}
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={election.status} />
        <Badge variant="outline">
          {election.schedulingMode === "manual" ? "Manual" : "Automatic"} scheduling
        </Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard icon={Users} label="Candidates" value={election.candidates.length} />
        <StatCard icon={Vote} label="Total Votes" value={election.totalVotes} />
        <StatCard icon={Eye} label="Unique Voters" value={election.uniqueVoterCount} />
        <StatCard icon={Calendar} label="Created" value={new Date(election.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
      </div>

      <Separator />

      {/* Config summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Voting Rules card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Voting Rules</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Max votes per voter</span>
              <span className="font-medium text-[var(--text-primary)]">{election.maxTotalVotesPerVoter}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Max per candidate</span>
              <span className="font-medium text-[var(--text-primary)]">{election.maxVotesPerCandidate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Voter visibility</span>
              <Badge variant={election.allowVoterVisibility ? "warning" : "outline"} className="text-xs">
                {election.allowVoterVisibility ? "Visible" : "Hidden"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Voter Base card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Voter Base</h3>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-light)]">
              <VoterIcon className="h-4 w-4 text-[var(--primary)]" />
            </div>
            <span className="text-sm text-[var(--text-primary)]">
              {voterModeLabel[election.voterBaseMode] || "Unknown"}
            </span>
          </div>
        </div>

        {/* Scheduling card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Schedule</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--text-muted)]" />
              <span className="text-[var(--text-secondary)]">
                {election.schedulingMode === "manual"
                  ? "Manually controlled"
                  : `${election.scheduledStartAt ? new Date(election.scheduledStartAt).toLocaleString() : "Not set"} → ${election.scheduledEndAt ? new Date(election.scheduledEndAt).toLocaleString() : "Not set"}`}
              </span>
            </div>
          </div>
        </div>

        {/* Top candidates card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Top Candidates</h3>
          <div className="space-y-2">
            {election.candidates
              .sort((a: { voteCount: number }, b: { voteCount: number }) => b.voteCount - a.voteCount)
              .slice(0, 3)
              .map((c: { _id: string; name: string; voteCount: number }, i: number) => (
                <div key={c._id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary-light)] text-xs font-medium text-[var(--primary)]">
                      {i + 1}
                    </span>
                    <span className="text-[var(--text-primary)] truncate">{c.name}</span>
                  </div>
                  <span className="text-[var(--text-muted)] tabular-nums">{c.voteCount}</span>
                </div>
              ))}
            {election.candidates.length === 0 && (
              <p className="text-xs text-[var(--text-muted)]">No candidates yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
