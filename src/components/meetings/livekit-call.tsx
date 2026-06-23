'use client'

import '@livekit/components-styles'
import { useEffect, useState } from 'react'
import { LiveKitRoom, VideoConference } from '@livekit/components-react'
import { Loader2, AlertTriangle } from 'lucide-react'

interface LiveKitCallProps {
  room: string
  identity: string
  name: string
  onDisconnected?: () => void
}

// Renders a full LiveKit video conference (camera, mic, screen-share, chat)
// for the given meeting room. Screen sharing is available from the control bar.
export function LiveKitCall({ room, identity, name, onDisconnected }: LiveKitCallProps) {
  const [token, setToken] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setError('')
    setToken('')
    fetch('/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, identity, name }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to get access token')
        return data
      })
      .then((data) => {
        if (cancelled) return
        setToken(data.token)
        setUrl(data.url)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Could not connect to video service')
      })
    return () => {
      cancelled = true
    }
  }, [room, identity, name])

  if (error) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <h2 className="text-xl font-black uppercase tracking-tighter">Video Unavailable</h2>
        <p className="max-w-md text-sm font-medium text-slate-300">{error}</p>
      </div>
    )
  }

  if (!token || !url) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--primary)]" />
        <p className="text-sm font-medium text-slate-300">Connecting to secure video room…</p>
      </div>
    )
  }

  return (
    <div className="h-[65vh] w-full" data-lk-theme="default">
      <LiveKitRoom
        token={token}
        serverUrl={url}
        connect
        video
        audio
        style={{ height: '100%' }}
        onDisconnected={onDisconnected}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  )
}
