'use client'

import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md transition-all duration-300">
      <div className="relative flex items-center justify-center">
        {/* Animated outer ring */}
        <div className="absolute w-24 h-24 border-4 border-[#0a192f]/5 border-t-[#c5a059] rounded-full animate-spin"></div>
        
        {/* Logo in center */}
        <div className="w-16 h-16 bg-[#0a192f] rounded-2xl flex items-center justify-center shadow-2xl z-10 transition-transform scale-100 hover:scale-110">
          <span className="text-white font-black text-2xl uppercase tracking-tighter">SA</span>
        </div>
      </div>
      
      <div className="mt-8 text-center space-y-2">
        <div className="text-[10px] font-black text-[#0a192f] uppercase tracking-[0.3em] animate-pulse">
          Legal Portal Synchronizing
        </div>
        <div className="h-0.5 w-32 bg-gray-100 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-[#c5a059] w-1/2 animate-[loading-shimmer_1.5s_infinite] origin-left"></div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes loading-shimmer {
          0% { transform: translateX(-100%) scaleX(0.5); }
          50% { transform: translateX(0%) scaleX(1); }
          100% { transform: translateX(100%) scaleX(0.5); }
        }
      `}</style>
    </div>
  )
}
