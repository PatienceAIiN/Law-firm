'use client'

import { Loader2 } from 'lucide-react'

export default function AdminLoading() {
  return (
    <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-[#0a192f]/5 border-t-[#c5a059] rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-[#0a192f] rounded-lg"></div>
        </div>
      </div>
      <div className="text-[10px] font-black text-[#0a192f] uppercase tracking-[0.2em] animate-pulse">
        Fetching Database Records...
      </div>
    </div>
  )
}
