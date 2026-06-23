'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[admin route error]', error)
  }, [error])
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-5 w-5" /> Something went wrong loading this tab
        </div>
        <p className="mt-2 text-sm">
          {error?.message || 'A transient error occurred.'} The database can briefly be over-subscribed on a free tier — try again.
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
