import { Skeleton } from '@/components/feedback/skeleton'

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Skeleton className="size-6 shrink-0 rounded-full" />
      <Skeleton className="h-3.5 flex-1" />
      <Skeleton className="h-3.5 w-16 shrink-0" />
    </div>
  )
}

export function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-10" aria-hidden>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-3.5 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[65%_1fr]">
        <Skeleton className="h-64 rounded-xl" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-36" />
        {Array.from({ length: 5 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[62%_1fr]">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 3 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
