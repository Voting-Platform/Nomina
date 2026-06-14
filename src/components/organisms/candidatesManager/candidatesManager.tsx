"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Input } from "@/components";
import { Textarea } from "@/components";
import { Button } from "@/components";
import { ConfirmDialog } from "@/components";
import { CandidateImageField } from "@/components";
import { addCandidate } from "@/lib/api/server/candidate/add-candidate";
import { updateCandidate } from "@/lib/api/server/candidate/update-candidate";
import { removeCandidate } from "@/lib/api/server/candidate/remove-candidate";
import { getElectionById } from "@/lib/api/server/election/get-election-by-id";
import { Plus, Pencil, Trash2, Save, X, Vote, AlertTriangle } from "lucide-react";
import type { ElectionDetailData, CandidateWithVoteCount } from "@/types";

function candidateInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return (parts[0]!.slice(0, 1) + parts[1]!.slice(0, 1)).toUpperCase();
}

function CandidateAvatar({
  imageUrl,
  nameForInitials,
  size = "sm",
}: {
  imageUrl: string | null;
  nameForInitials: string;
  size?: "sm" | "full";
}) {
  if (size === "full") {
    if (imageUrl) {
      return (
        <Image
          src={imageUrl}
          alt={nameForInitials}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
        />
      );
    }
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--primary-light)]">
        <span className="text-4xl font-bold text-[var(--primary)]">
          {candidateInitials(nameForInitials)}
        </span>
      </div>
    );
  }

  const shell =
    "flex h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-sm";

  if (imageUrl) {
    return (
      <div className={shell}>
        <Image src={imageUrl} alt="" width={56} height={56} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${shell} items-center justify-center bg-[var(--primary-light)] text-sm font-semibold text-[var(--primary)]`}
      aria-hidden
    >
      {candidateInitials(nameForInitials)}
    </div>
  );
}

interface CandidatesManagerProps {
  electionId: string;
  initialData: ElectionDetailData;
}

export function CandidatesManager({ electionId, initialData }: CandidatesManagerProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [initialDataTimestamp] = useState(() => Date.now());

  const { data: election } = useQuery<ElectionDetailData>({
    queryKey: ["election", electionId],
    queryFn: () => getElectionById(electionId) as Promise<ElectionDetailData>,
    initialData,
    initialDataUpdatedAt: initialDataTimestamp,
  });

  const candidates = election.candidates;
  const hasStarted = ["open", "closed", "archived"].includes(election.status);

  // Add candidate state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImageUrl, setNewImageUrl] = useState<string | undefined>(undefined);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImageUrl, setEditImageUrl] = useState<string | undefined>(undefined);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    if (hasStarted) return;
    if (!newName.trim()) return;
    startTransition(async () => {
      await addCandidate(electionId, {
        name: newName.trim(),
        description: newDescription.trim(),
        ...(newImageUrl ? { imageUrl: newImageUrl } : {}),
      });
      setNewName("");
      setNewDescription("");
      setNewImageUrl(undefined);
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ["election", electionId] });
    });
  };

  const startEdit = (c: typeof candidates[number]) => {
    if (hasStarted) return;
    setEditId(c._id);
    setEditName(c.name);
    setEditDesc(c.description);
    setEditImageUrl(c.imageUrl ?? undefined);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditImageUrl(undefined);
  };

  const handleUpdate = () => {
    if (hasStarted || !editId || !editName.trim()) return;
    startTransition(async () => {
      await updateCandidate(editId, {
        name: editName.trim(),
        description: editDesc.trim(),
        imageUrl: editImageUrl ?? null,
      });
      setEditId(null);
      setEditImageUrl(undefined);
      queryClient.invalidateQueries({ queryKey: ["election", electionId] });
    });
  };

  const confirmDelete = () => {
    if (hasStarted || !deleteId) return;
    startTransition(async () => {
      await removeCandidate(deleteId);
      setDeleteDialogOpen(false);
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["election", electionId] });
    });
  };

  return (
    <div className="space-y-4">
      {hasStarted && (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning-light)]/50 p-4 text-[var(--warning)] shadow-sm animate-in fade-in duration-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--warning)] mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-[var(--text-primary)]">Election has started</h4>
            <p className="text-xs mt-1 text-[var(--text-secondary)] leading-relaxed">
              You cannot edit the candidates, rules, or settings once the election has started to ensure voting integrity.
            </p>
          </div>
        </div>
      )}

      {/* Candidate grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {candidates.map((c: CandidateWithVoteCount, i: number) => (
          <div
            key={c._id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-all duration-200 hover:shadow-md hover:border-[var(--primary)]/30 flex flex-col"
          >
            {editId === c._id && !hasStarted ? (
              /* ── Edit mode ── */
              <div className="p-4 space-y-3 flex-1">
                <CandidateImageField
                  imageUrl={editImageUrl}
                  onImageUrlChange={setEditImageUrl}
                  disabled={isPending}
                />
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Name"
                />
                <Textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Description"
                  rows={2}
                />
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={handleUpdate} disabled={isPending} className="flex-1">
                    <Save className="h-3.5 w-3.5" /> {isPending ? "Saving…" : "Save"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              /* ── View mode ── */
              <>
                {/* Image */}
                <div className="relative aspect-square bg-[var(--background)] overflow-hidden">
                  <CandidateAvatar imageUrl={c.imageUrl} nameForInitials={c.name} size="full" />

                  {/* Rank badge */}
                  <span className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white shadow-md">
                    {i + 1}
                  </span>

                  {/* Vote count overlay */}
                  <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                    <Vote className="h-3 w-3" />
                    {c.voteCount}
                  </span>
                </div>

                {/* Info */}
                <div className="p-3 flex-1">
                  <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{c.name}</p>
                  {c.description ? (
                    <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  ) : null}
                </div>

                {/* Action bar — hidden when election has started */}
                {!hasStarted && (
                  <div className="flex border-t border-[var(--border)] divide-x divide-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDeleteId(c._id); setDeleteDialogOpen(true); }}
                      className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add form */}
      {!hasStarted && (
        showAddForm ? (
          <div className="rounded-xl border-2 border-dashed border-[var(--primary)]/30 bg-[var(--primary-light)]/30 p-4 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <CandidateImageField
                imageUrl={newImageUrl}
                onImageUrlChange={setNewImageUrl}
                disabled={isPending}
              />
              <div className="min-w-0 flex-1 space-y-2">
                <Input placeholder="Candidate name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <Textarea
                  placeholder="Description (optional)"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={isPending || !newName.trim()}>
                <Plus className="h-3.5 w-3.5" /> {isPending ? "Adding..." : "Add"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddForm(false);
                  setNewName("");
                  setNewDescription("");
                  setNewImageUrl(undefined);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setShowAddForm(true)} className="w-full">
            <Plus className="h-4 w-4" /> Add Candidate
          </Button>
        )
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove Candidate"
        description="Are you sure? This candidate and their votes will be removed."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={confirmDelete}
        loading={isPending}
      />
    </div>
  );
}
