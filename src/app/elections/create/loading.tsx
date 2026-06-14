import { SmartLoader } from "@/components/atoms/smartLoader";
import { Skeleton } from "@/components/ui/skeleton";

function CreateElectionSkeleton() {
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Page header */}
      <div className="mb-8 space-y-2 text-center sm:text-left">
        <Skeleton className="h-8 w-56 mx-auto sm:mx-0" />
        <Skeleton className="h-4 w-72 mx-auto sm:mx-0" />
      </div>

      {/* Step indicator — 6 dots */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-full" />
        ))}
      </div>

      {/* Step card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8 space-y-5">
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex items-center justify-between">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </main>
  );
}

export default function CreateElectionLoading() {
  return <SmartLoader skeleton={<CreateElectionSkeleton />} />;
}
