export default function ProjectLoading() {
  return (
    <div className="space-y-10 pb-16 animate-pulse">
      {/* Project name */}
      <div className="flex flex-col gap-2">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-4 w-32 bg-muted rounded mt-1" />
      </div>

      {/* Lumber section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 bg-muted rounded" />
          <div className="h-8 w-28 bg-muted rounded" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </div>
      </div>

      {/* Hardware section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 bg-muted rounded" />
          <div className="h-8 w-28 bg-muted rounded" />
        </div>
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </div>
      </div>

      {/* Cost summary */}
      <div className="h-48 bg-muted rounded-lg" />
    </div>
  );
}
