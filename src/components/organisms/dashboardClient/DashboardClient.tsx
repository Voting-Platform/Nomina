"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button, ConfirmDialog, ElectionStatsBar, ElectionGrid, EmptyState, SearchFilterBar } from "@/components";
import { useDeleteElection, useDuplicateElection } from "@/hooks/election";
import type { ElectionSummary, ElectionStatus } from "@/types";

interface DashboardClientProps {
  elections: ElectionSummary[];
}

export function DashboardClient({ elections }: DashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ElectionStatus | "all">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const deleteMutation = useDeleteElection();
  const duplicateMutation = useDuplicateElection();

  const filteredElections = useMemo(() => {
    return elections.filter((e) => {
      const matchesSearch =
        searchQuery === "" ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [elections, searchQuery, statusFilter]);

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTargetId) return;
    deleteMutation.mutate(deleteTargetId, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setDeleteTargetId(null);
      },
    });
  };

  const handleDuplicate = (id: string) => {
    duplicateMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <ElectionStatsBar elections={elections} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>
        <Button asChild className="shrink-0">
          <Link href="/elections/create">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Election</span>
            <span className="sm:hidden">Create</span>
          </Link>
        </Button>
      </div>

      {elections.length === 0 ? (
        <EmptyState />
      ) : filteredElections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            No elections match your search
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="mt-2 text-sm text-[var(--primary)] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ElectionGrid
          elections={filteredElections}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          duplicatingId={duplicateMutation.isPending ? duplicateMutation.variables : undefined}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Election"
        description="Are you sure you want to delete this election? This action cannot be undone. All candidates and votes will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
