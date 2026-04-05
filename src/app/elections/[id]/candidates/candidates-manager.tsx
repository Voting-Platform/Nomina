"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/atoms/input";
import { Textarea } from "@/components/atoms/textarea";
import { Button } from "@/components/atoms/button";
import { Badge } from "@/components/atoms/badge";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { addCandidate } from "@/actions/candidate/add-candidate";
import { updateCandidate } from "@/actions/candidate/update-candidate";
import { removeCandidate } from "@/actions/candidate/remove-candidate";
import { Plus, Pencil, Trash2, Save, X, Vote } from "lucide-react";

interface CandidateData {
  _id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  position: number;
  voteCount: number;
}

interface CandidatesManagerProps {
  electionId: string;
  initialCandidates: CandidateData[];
}

export function CandidatesManager({ electionId, initialCandidates }: CandidatesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Add candidate state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    startTransition(async () => {
      await addCandidate(electionId, { name: newName.trim(), description: newDescription.trim() });
      setNewName("");
      setNewDescription("");
      setShowAddForm(false);
      router.refresh();
    });
  };

  const startEdit = (c: CandidateData) => {
    setEditId(c._id);
    setEditName(c.name);
    setEditDesc(c.description);
  };

  const handleUpdate = () => {
    if (!editId || !editName.trim()) return;
    startTransition(async () => {
      await updateCandidate(editId, { name: editName.trim(), description: editDesc.trim() });
      setEditId(null);
      router.refresh();
    });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      await removeCandidate(deleteId);
      setDeleteDialogOpen(false);
      setDeleteId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Candidate list */}
      <div className="space-y-3">
        {initialCandidates.map((c, i) => (
          <div
            key={c._id}
            className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-200 hover:border-[var(--primary)]/20"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary-light)] text-xs font-semibold text-[var(--primary)] mt-0.5">
              {i + 1}
            </span>

            {editId === c._id ? (
              // Edit mode
              <div className="flex-1 space-y-2">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" />
                <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description" rows={2} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdate} disabled={isPending}>
                    <Save className="h-3.5 w-3.5" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                    <X className="h-3.5 w-3.5" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // View mode
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">{c.name}</p>
                {c.description && (
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{c.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    <Vote className="h-3 w-3 mr-1" /> {c.voteCount} votes
                  </Badge>
                </div>
              </div>
            )}

            {editId !== c._id && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-all"
                  aria-label="Edit candidate"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => { setDeleteId(c._id); setDeleteDialogOpen(true); }}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--destructive)] hover:bg-[var(--destructive-light)] transition-all"
                  aria-label="Remove candidate"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAddForm ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--primary)]/30 bg-[var(--primary-light)]/30 p-4 space-y-3">
          <Input placeholder="Candidate name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Textarea placeholder="Description (optional)" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={isPending || !newName.trim()}>
              <Plus className="h-3.5 w-3.5" /> {isPending ? "Adding..." : "Add"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setShowAddForm(true)} className="w-full">
          <Plus className="h-4 w-4" /> Add Candidate
        </Button>
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
