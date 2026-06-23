'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function TenantError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[tenant route error]', error)
  }, [error])
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#FFFCF8] px-4 dark:bg-[#0b0f17]">
      <div className="max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-5 w-5" /> Page couldn't load
        </div>
        <p className="mt-2 text-sm">
          {error?.message || 'A transient error occurred.'} Try again in a moment.
        </p>
        {error?.digest && <p className="mt-1 text-xs text-rose-500">ref: {error.digest}</p>}
        <button
          onClick={reset}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    </div>
  )
}
