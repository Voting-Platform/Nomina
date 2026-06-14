"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input, Textarea, Label, Button } from "@/components";
import { updateElection, getElectionById } from "@/lib/api/server";
import type { ElectionDetailData } from "@/types";
import { Save } from "lucide-react";

interface EditElectionFormProps {
  electionId: string;
  initialData: ElectionDetailData;
}

export function EditElectionForm({ electionId, initialData }: EditElectionFormProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [initialDataTimestamp] = useState(() => Date.now());

  useQuery({
    queryKey: ["election", electionId],
    queryFn: () => getElectionById(electionId),
    initialData,
    initialDataUpdatedAt: initialDataTimestamp,
  });

  // Form state is seeded from initialData on mount and stays independent after that
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    startTransition(async () => {
      try {
        await updateElection(electionId, {
          title: title.trim(),
          description: description.trim(),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        queryClient.invalidateQueries({ queryKey: ["election", electionId] });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
        <div className="space-y-2">
          <Label htmlFor="edit-title">Title</Label>
          <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-desc">Description</Label>
          <Textarea id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Voter access settings (public/protected, PIN, privacy) have moved to
        the Share tab.
      </p>

      {error && (
        <p className="text-sm text-[var(--destructive)] bg-[var(--destructive-light)] px-4 py-3 rounded-lg">{error}</p>
      )}
      {saved && (
        <p className="text-sm text-[var(--secondary)] bg-[var(--secondary-light)] px-4 py-3 rounded-lg">Changes saved successfully!</p>
      )}

      <Button onClick={handleSave} disabled={isPending}>
        <Save className="h-4 w-4" />
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
