// src/components/ui/Skeleton.jsx
import clsx from 'clsx'

export function SkeletonLine({ className }) {
  return (
    <div className={clsx(
      'bg-[#1e2d3d] rounded-lg animate-pulse',
      className
    )} />
  )
}

export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex justify-between">
        <SkeletonLine className="h-3 w-24" />
        <SkeletonLine className="h-3 w-16" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 flex flex-col items-center gap-2">
          <SkeletonLine className="w-10 h-10 rounded-full" />
          <SkeletonLine className="h-2 w-16" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <SkeletonLine className="h-3 w-20" />
          <SkeletonLine className="h-3 w-14" />
        </div>
        <div className="flex-1 flex flex-col items-center gap-2">
          <SkeletonLine className="w-10 h-10 rounded-full" />
          <SkeletonLine className="h-2 w-16" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonRankRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <SkeletonLine className="w-6 h-4" />
      <SkeletonLine className="w-9 h-9 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <SkeletonLine className="h-3 w-28" />
        <SkeletonLine className="h-2 w-16" />
      </div>
      <SkeletonLine className="h-5 w-12" />
    </div>
  )
}
