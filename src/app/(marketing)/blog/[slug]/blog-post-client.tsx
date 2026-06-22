'use client'

import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'

interface BlogPostClientProps {
  slug: string
  title: string
  excerpt?: string | null
}

export function BlogPostClient({ slug, title, excerpt }: BlogPostClientProps) {
  const [state, setState] = useState<'idle' | 'copied'>('idle')

  const handleShare = async () => {
    const url = `${window.location.origin}/blog/${slug}`
    if (navigator.share) {
      try {
        await navigator.share({ title, text: excerpt || title, url })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      setState('copied')
      setTimeout(() => setState('idle'), 2500)
    }
  }

  return (
    <div className="mt-20 pt-10 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-[#14203E] rounded-full flex items-center justify-center text-[#14203E] font-black">
          SA
        </div>
        <div>
          <div className="text-sm font-black text-[#14203E] uppercase tracking-wider">Senior Advocate</div>
          <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Editorial Team</div>
        </div>
      </div>

      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-6 py-3 bg-[#f8fafc] border border-gray-200 rounded-full text-[#14203E] font-bold text-sm hover:bg-[#F6F0E8] hover:text-white hover:border-[#F4E8D8] transition-all"
      >
        {state === 'copied' ? (
          <><Check className="w-4 h-4 text-green-400" /> Link Copied!</>
        ) : (
          <><Share2 className="w-4 h-4" /> SHARE INSIGHT</>
        )}
      </button>
    </div>
  )
}
