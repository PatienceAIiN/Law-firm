'use client'

import { Loader2 } from 'lucide-react'

export default function AdminLoading() {
  return (
    <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-[var(--primary)]/5 border-t-[#14203E] rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-[var(--primary)] rounded-lg"></div>
        </div>
      </div>
      <div className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.2em] animate-pulse">
        Fetching Database Records...
      </div>
    </div>
  )
}
