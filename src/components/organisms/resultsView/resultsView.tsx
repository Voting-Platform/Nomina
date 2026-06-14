"use client";

import { useState, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Progress } from "@/components";
import {
  exportElectionCsv,
  getElectionById,
  getVoterLog,
} from "@/lib/api/server";
import { Download, Trophy, Medal, Users, EyeOff } from "lucide-react";
import type { ElectionDetailData } from "@/types";

interface ResultsViewProps {
  electionId: string;
  initialData: ElectionDetailData;
}

export function ResultsView({ electionId, initialData }: ResultsViewProps) {
  const [isPending, startTransition] = useTransition();
  const [initialDataTimestamp] = useState(() => Date.now());

  const { data: election } = useQuery({
    queryKey: ["election", electionId],
    queryFn: () => getElectionById(electionId),
    initialData,
    initialDataUpdatedAt: initialDataTimestamp,
  });

  const { data: voterLog } = useQuery({
    queryKey: ["voter-log", electionId],
    queryFn: () => getVoterLog(electionId),
    enabled: election.revealVoterIdentities,
  });

  const sorted = [...election.candidates].sort((a, b) => b.voteCount - a.voteCount);

  const handleExport = () => {
    startTransition(async () => {
      const result = await exportElectionCsv(electionId);
      const blob = new Blob([result.content], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 1) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-amber-600" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Export button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleExport} disabled={isPending}>
          <Download className="h-4 w-4" />
          {isPending ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {/* Results list */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <p className="text-sm text-[var(--text-muted)]">No votes cast yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((candidate, index) => {
            const percentage = election.totalVotes > 0 ? (candidate.voteCount / election.totalVotes) * 100 : 0;
            const isLeader = index === 0 && candidate.voteCount > 0;

            return (
              <div
                key={candidate._id}
                className={`rounded-xl border bg-[var(--surface)] p-4 sm:p-5 transition-all duration-200
                  ${isLeader ? "border-[var(--primary)]/40 ring-2 ring-[var(--primary)]/10 shadow-md" : "border-[var(--border)]"}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold
                      ${isLeader ? "bg-[var(--primary)] text-white" : "bg-[var(--background)] text-[var(--text-secondary)]"}`}
                    >
                      {getRankIcon(index) || index + 1}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isLeader ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>
                        {candidate.name}
                      </p>
                      {candidate.description && (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">{candidate.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
                      {candidate.voteCount}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <Progress
                  value={percentage}
                  className="h-2"
                  indicatorClassName={isLeader ? "bg-[var(--primary)]" : "bg-[var(--text-muted)]"}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Voter log — owner-only, gated by revealVoterIdentities */}
      {election.revealVoterIdentities ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--primary)]" />
            Voter Log
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Only you (the organizer) can see this list.
          </p>

          {!voterLog ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              Loading voter log...
            </p>
          ) : voterLog.rows.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              No votes recorded yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left">
                    <th className="py-2 pr-4 text-xs font-medium text-[var(--text-muted)]">Voter</th>
                    <th className="py-2 pr-4 text-xs font-medium text-[var(--text-muted)]">Email</th>
                    <th className="py-2 pr-4 text-xs font-medium text-[var(--text-muted)]">Voted for</th>
                    <th className="py-2 pr-4 text-xs font-medium text-[var(--text-muted)] text-right">Votes</th>
                    <th className="py-2 text-xs font-medium text-[var(--text-muted)]">When</th>
                  </tr>
                </thead>
                <tbody>
                  {voterLog.rows.map((row, i) => (
                    <tr key={i} className="border-b border-[var(--border)]/50 last:border-0">
                      <td className="py-2 pr-4 font-medium text-[var(--text-primary)]">
                        {row.voterName}
                      </td>
                      <td className="py-2 pr-4 text-[var(--text-secondary)]">
                        {row.voterEmail || "—"}
                      </td>
                      <td className="py-2 pr-4 text-[var(--text-primary)]">
                        {row.candidateName}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-[var(--text-primary)]">
                        {row.votes}
                      </td>
                      <td className="py-2 text-xs text-[var(--text-muted)]">
                        {new Date(row.castedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
          <EyeOff className="h-3.5 w-3.5" />
          Votes are anonymous for this election. Enable &quot;Reveal voter
          identities&quot; in the Share tab to see who voted.
        </p>
      )}
    </div>
  );
}
