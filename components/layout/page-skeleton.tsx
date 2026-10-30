import { Skeleton } from "@/components/ui/skeleton";

// Shared route-level loading.tsx fallback: title, toolbar, and a list of rows.
export function PageSkeleton() {
  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-7 w-56 mb-2" />
      <Skeleton className="h-4 w-80 mb-6" />
      <div className="flex gap-3 mb-5">
        <Skeleton className="h-9 flex-1 max-w-sm" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
