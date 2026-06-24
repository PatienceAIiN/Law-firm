export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 w-40 rounded bg-slate-200 dark:bg-white/10" />
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#11151f]">
        {[0,1,2,3,4].map((i)=>(
          <div key={i} className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 last:border-0 dark:border-white/5">
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-white/5" />
            </div>
            <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  )
}
