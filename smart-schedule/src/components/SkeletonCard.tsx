export function SkeletonCard() {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="skeleton-shimmer h-4 w-1/3" />
      <div className="skeleton-shimmer h-8 w-1/2" />
      <div className="skeleton-shimmer h-3 w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="skeleton-shimmer h-4 w-1/4 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="skeleton-shimmer h-4 w-1/4" />
          <div className="skeleton-shimmer h-4 w-1/3" />
          <div className="skeleton-shimmer h-4 w-1/5" />
        </div>
      ))}
    </div>
  );
}
