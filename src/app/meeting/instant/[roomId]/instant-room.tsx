'use client'

import '@livekit/components-styles'
import { useState } from 'react'
import { LiveKitRoom, VideoConference } from '@livekit/components-react'
import { AlertTriangle, X } from 'lucide-react'

export function InstantRoom({
  roomId, token, serverUrl, displayName,
}: { roomId: string; token: string; serverUrl: string; displayName: string }) {
  const [ended, setEnded] = useState(false)

  if (ended) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-[#0b0f17]">
        <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow dark:border-white/10 dark:bg-[#11151f]">
          <h2 className="text-lg font-bold text-primary dark:text-white">Call ended</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">You left the consultation. You can close this tab now.</p>
        </div>
      </div>
    )
  }
  if (!token || !serverUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-[#0b0f17]">
        <div className="max-w-sm rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-500/30 dark:bg-amber-900/20">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-600" />
          <h2 className="mt-3 text-base font-bold text-amber-900 dark:text-amber-100">Invalid meeting link</h2>
          <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">The token has expired or the link is malformed. Ask the firm to send a fresh invite.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen bg-black">
      <button
        onClick={() => setEnded(true)}
        className="absolute right-4 top-4 z-50 inline-flex items-center gap-1.5 rounded-full bg-rose-600/90 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur hover:bg-rose-700"
      >
        <X className="h-3.5 w-3.5" /> Leave call
      </button>
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect
        data-lk-theme="default"
        style={{ height: '100vh' }}
        onDisconnected={() => setEnded(true)}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  )
}
