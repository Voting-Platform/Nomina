import { SmartLoader, Skeleton } from "@/components";

function ElectionDetailSkeleton() {
  return (
    <main className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Election header */}
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Tab navigation — 7 tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] pb-px">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-md" />
        ))}
      </div>

      <div className="mt-6 space-y-6">
        {/* Status + scheduling badges */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>

        {/* Stat cards — 4 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-10" />
              </div>
            </div>
          ))}
        </div>

        {/* Separator */}
        <Skeleton className="h-px w-full" />

        {/* Config cards — 2×2 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function ElectionDetailLoading() {
  return <SmartLoader skeleton={<ElectionDetailSkeleton />} />;
}
