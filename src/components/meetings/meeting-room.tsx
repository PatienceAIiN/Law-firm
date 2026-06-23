'use client'

import '@livekit/components-styles'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LiveKitRoom, VideoConference } from '@livekit/components-react'
import {
  Loader2, AlertTriangle, Share2, Circle, Square, FileText, Mail,
  PhoneOff, Check, X, Copy, Monitor,
} from 'lucide-react'

type Booking = {
  id: string
  name: string
  email: string
  subject: string
  meetingMode: string
  meetingLink: string | null
}

interface MeetingRoomProps {
  booking: Booking
  allowRecording: boolean
  adminView?: boolean
}

async function logActivity(bookingId: string, type: string, details: string) {
  try {
    await fetch('/api/admin/meeting-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, type, details }),
    })
  } catch {}
}

export function MeetingRoom({ booking, allowRecording, adminView = false }: MeetingRoomProps) {
  const [token, setToken] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [ended, setEnded] = useState(false)
  const [connected, setConnected] = useState(false)
  const connectedRef = useRef(false)

  // Recording (screen capture via MediaRecorder)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [recording, setRecording] = useState(false)
  const [recSaving, setRecSaving] = useState(false)

  // Panels + toast
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [momBusy, setMomBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [shareOpen, setShareOpen] = useState(false)

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2600) }

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/meeting/${booking.id}` : ''
  const notesKey = `meeting-notes-${booking.id}`

  useEffect(() => {
    try { const s = localStorage.getItem(notesKey); if (s) setNotes(s) } catch {}
  }, [notesKey])
  useEffect(() => {
    try { localStorage.setItem(notesKey, notes) } catch {}
  }, [notesKey, notes])

  // Get LiveKit token
  useEffect(() => {
    let cancelled = false
    fetch('/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room: booking.id,
        identity: adminView ? `advocate-${booking.id}` : `client-${booking.id}`,
        name: adminView ? 'Advocate' : booking.name,
      }),
    })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Token error'); return d })
      .then((d) => { if (!cancelled) { setToken(d.token); setUrl(d.url) } })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Could not connect') })
    return () => { cancelled = true }
  }, [booking.id, booking.name, adminView])

  useEffect(() => {
    logActivity(booking.id, 'MEETING_JOINED', `${adminView ? 'Advocate' : 'Client'} joined the room`)
  }, [booking.id, adminView])

  // ── Recording ───────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm'
      const rec = new MediaRecorder(stream, { mimeType: mime })
      streamRef.current = stream; recorderRef.current = rec; chunksRef.current = []
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime })
        setRecSaving(true)
        try {
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = `meeting-${booking.id}.webm`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(a.href)
          flash('Recording downloaded locally')
        } catch { flash('Error saving recording') }
        finally { setRecSaving(false) }
      }
      // If the user stops sharing via the browser UI, stop recording too.
      stream.getVideoTracks()[0].addEventListener('ended', () => stopRecording())
      rec.start(1000)
      setRecording(true)
      logActivity(booking.id, 'RECORDING_STARTED', 'Recording started')
    } catch {
      flash('Recording permission denied')
    }
  }
  const stopRecording = useCallback(() => {
    recorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setRecording(false)
  }, [])

  // ── Share ─────────────────────────────────────────────────────────────────
  const share = async () => {
    const data = { title: 'Join meeting', text: `Join the meeting: ${booking.subject}`, url: shareUrl }
    if (navigator.share) {
      try { await navigator.share(data); return } catch {}
    }
    setShareOpen(true)
  }
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); flash('Link copied') } catch {}
    setShareOpen(false)
  }

  // ── MoM ─────────────────────────────────────────────────────────────────────
  const sendMoM = async () => {
    setMomBusy(true)
    try {
      const r = await fetch('/api/meeting-mom', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, notes }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      flash(`Minutes emailed to ${d.recipients?.length || 0} participant(s)`)
    } catch (e: any) { flash(e?.message || 'Could not send minutes') }
    finally { setMomBusy(false) }
  }

  const endMeeting = () => {
    // Treat a disconnect as "ended" only if we ever successfully connected.
    // Otherwise the LiveKit server is unreachable and we should show an error.
    if (!connectedRef.current) {
      setError(
        'Could not reach the video server. Check LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and NEXT_PUBLIC_LIVEKIT_URL — for local dev, run a LiveKit server or use a LiveKit Cloud URL.',
      )
      return
    }
    if (recording) stopRecording()
    logActivity(booking.id, 'MEETING_ENDED', `${adminView ? 'Advocate' : 'Client'} left the meeting`)
    setEnded(true)
  }

  const handleConnected = () => {
    connectedRef.current = true
    setConnected(true)
  }

  // ── Render states ────────────────────────────────────────────────────────────
  if (ended) {
    return (
      <div className="flex h-[100dvh] w-screen flex-col items-center justify-center gap-4 bg-[#0b0f17] text-white">
        <Check className="h-14 w-14 text-emerald-400" />
        <h2 className="text-2xl font-bold">You left the meeting</h2>
        <button onClick={() => window.close()} className="rounded-lg bg-white/10 px-5 py-2.5 text-sm hover:bg-white/20">Close tab</button>
        <a href={shareUrl} className="text-sm text-white/60 hover:text-white">Rejoin</a>
      </div>
    )
  }

  if (booking.meetingMode === 'PHYSICAL') {
    return (
      <div className="flex h-[100dvh] w-screen flex-col items-center justify-center gap-4 bg-[#0b0f17] p-8 text-center text-white">
        <Monitor className="h-14 w-14 text-secondary" />
        <h2 className="text-2xl font-bold">In-Person Consultation</h2>
        <p className="max-w-lg text-white/70">{booking.meetingLink || 'The office address will be shared by the advocate team.'}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[100dvh] w-screen flex-col items-center justify-center gap-4 bg-[#0b0f17] p-8 text-center text-white">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <h2 className="text-xl font-bold">Video Unavailable</h2>
        <p className="max-w-md text-white/60">{error}</p>
      </div>
    )
  }

  if (!token || !url) {
    return (
      <div className="flex h-[100dvh] w-screen flex-col items-center justify-center gap-4 bg-[#0b0f17] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-secondary" />
        <p className="text-sm text-white/70">Joining secure meeting…</p>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#0b0f17] text-white" data-lk-theme="default">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#11151f] px-4 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{booking.subject || 'Consultation'}</div>
          <div className="truncate text-[11px] text-white/50">{booking.name} · {adminView ? 'Advocate view' : 'Client'}</div>
        </div>
        <div className="flex items-center gap-2">
          {recording && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> REC
            </span>
          )}
          <button onClick={share} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20">
            <Share2 className="h-4 w-4" /> Share
          </button>
          {allowRecording && (
            recording ? (
              <button onClick={stopRecording} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium hover:bg-red-700">
                <Square className="h-3.5 w-3.5" /> Stop
              </button>
            ) : (
              <button onClick={startRecording} disabled={recSaving} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20 disabled:opacity-60">
                {recSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Circle className="h-3.5 w-3.5 text-red-400" />} Record
              </button>
            )
          )}
          <button onClick={() => setShowNotes((s) => !s)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-white/20 ${showNotes ? 'bg-white/20' : 'bg-white/10'}`}>
            <FileText className="h-4 w-4" /> Notes
          </button>
          <button onClick={endMeeting} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold hover:bg-red-700">
            <PhoneOff className="h-4 w-4" /> Leave
          </button>
        </div>
      </div>

      {/* Stage + notes panel */}
      <div className="relative flex min-h-0 flex-1">
        <div className="min-h-0 flex-1">
          <LiveKitRoom
            token={token}
            serverUrl={url}
            connect
            video
            audio
            style={{ height: '100%' }}
            onConnected={handleConnected}
            onDisconnected={endMeeting}
            onError={(e) => setError(e?.message || 'Video connection failed')}
          >
            <VideoConference />
          </LiveKitRoom>
        </div>

        {showNotes && (
          <aside className="flex h-full w-full max-w-[360px] shrink-0 flex-col border-l border-white/10 bg-[#11151f]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-semibold">Meeting Notes</span>
              <button onClick={() => setShowNotes(false)} className="rounded-md p-1 hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type minutes / action items… (auto-saved on this device)"
              className="min-h-0 flex-1 resize-none bg-transparent p-4 text-sm text-white/90 outline-none placeholder:text-white/30"
            />
            <div className="border-t border-white/10 p-3">
              <button onClick={sendMoM} disabled={momBusy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-[#0b0f17] hover:bg-[#d8b33a] disabled:opacity-60">
                {momBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Email Minutes to Joinees
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Share popover */}
      {shareOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" onClick={() => setShareOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-[#11151f] p-5 ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">Share meeting link</h3>
              <button onClick={() => setShareOpen(false)} className="rounded-md p-1 hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-black/30 p-2">
              <input readOnly value={shareUrl} className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white/80 outline-none" />
              <button onClick={copyLink} className="flex shrink-0 items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-semibold text-[#0b0f17]"><Copy className="h-3.5 w-3.5" /> Copy</button>
            </div>
            <p className="mt-3 text-xs text-white/40">Anyone with this link can join this consultation room.</p>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[210] -translate-x-1/2 rounded-xl bg-black/80 px-4 py-2 text-sm ring-1 ring-white/10">{toast}</div>
      )}
    </div>
  )
}
