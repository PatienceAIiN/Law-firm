// Reusable skeleton primitives for App Router loading.tsx files.

export function PageSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'list' | 'article' | 'hero' }) {
  if (variant === 'hero') {
    return (
      <div className="mx-auto max-w-5xl animate-pulse px-6 py-16">
        <div className="mx-auto h-6 w-40 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="mt-6 space-y-3">
          <div className="mx-auto h-10 w-3/4 rounded bg-slate-200 dark:bg-white/10" />
          <div className="mx-auto h-10 w-2/3 rounded bg-slate-200 dark:bg-white/10" />
        </div>
        <div className="mt-6 space-y-2">
          <div className="mx-auto h-4 w-2/3 rounded bg-slate-100 dark:bg-white/5" />
          <div className="mx-auto h-4 w-1/2 rounded bg-slate-100 dark:bg-white/5" />
        </div>
        <div className="mt-8 flex justify-center gap-3">
          <div className="h-11 w-48 rounded-xl bg-slate-200 dark:bg-white/10" />
          <div className="h-11 w-32 rounded-xl bg-slate-100 dark:bg-white/5" />
        </div>
      </div>
    )
  }

  if (variant === 'article') {
    return (
      <div className="mx-auto max-w-3xl animate-pulse px-6 py-16">
        <div className="h-9 w-3/4 rounded bg-slate-200 dark:bg-white/10" />
        <div className="mt-4 flex gap-4">
          <div className="h-4 w-28 rounded bg-slate-100 dark:bg-white/5" />
          <div className="h-4 w-16 rounded bg-slate-100 dark:bg-white/5" />
        </div>
        <div className="mt-8 h-56 w-full rounded-2xl bg-slate-200 dark:bg-white/10" />
        <div className="mt-8 space-y-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-3 w-full rounded bg-slate-100 dark:bg-white/5" />
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <div className="mx-auto max-w-3xl animate-pulse px-6 py-12">
        <div className="h-8 w-48 rounded bg-slate-200 dark:bg-white/10" />
        <div className="mt-2 h-4 w-72 rounded bg-slate-100 dark:bg-white/5" />
        <div className="mt-8 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#11151f]">
              <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-white/10" />
              <div className="mt-2 h-3 w-2/3 rounded bg-slate-100 dark:bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Default: grid (practice areas, team)
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-6 py-16">
      <div className="h-9 w-48 rounded bg-slate-200 dark:bg-white/10" />
      <div className="mt-2 h-4 w-72 rounded bg-slate-100 dark:bg-white/5" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
            <div className="h-6 w-6 rounded bg-slate-200 dark:bg-white/10" />
            <div className="mt-3 h-4 w-3/4 rounded bg-slate-200 dark:bg-white/10" />
            <div className="mt-2 space-y-1.5">
              <div className="h-3 w-full rounded bg-slate-100 dark:bg-white/5" />
              <div className="h-3 w-5/6 rounded bg-slate-100 dark:bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
