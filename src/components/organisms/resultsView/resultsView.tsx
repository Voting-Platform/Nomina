"use client";

import { useState, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { exportElectionCsv } from "@/lib/api/server/election/export-election-csv";
import { getElectionById } from "@/lib/api/server/election/get-election-by-id";
import { Download, Trophy, Medal } from "lucide-react";
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
    </div>
  );
}
