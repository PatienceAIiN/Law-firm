export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-32 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#11151f]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex animate-pulse items-center justify-between border-b border-slate-100 py-3 last:border-0 dark:border-white/5">
            <div className="space-y-2">
              <div className="h-3 w-40 rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-3 w-24 rounded bg-slate-100 dark:bg-white/5" />
            </div>
            <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  )
}
