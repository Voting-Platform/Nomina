export default function VoteLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--primary)]" />
      <p className="text-sm text-[var(--text-muted)]">Loading election...</p>
    </div>
  );
}
