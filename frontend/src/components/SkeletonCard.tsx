export function SkeletonCard() {
  return (
    <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-surface-3/50 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="skeleton w-8 h-8 rounded-full" />
        <div className="flex-1">
          <div className="skeleton h-4 w-3/4 mb-1" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      </div>
      <div className="skeleton h-3 w-full mb-2" />
      <div className="skeleton h-3 w-2/3 mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="skeleton h-6 w-20 rounded" />
        <div className="skeleton h-6 w-16 rounded" />
      </div>
      <div className="skeleton h-10 w-40 rounded-lg" />
    </div>
  );
}
