'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Calendar, Clock, Download, FileVideo, Loader2, Maximize,
  Mic, Monitor, Save, Video, ShieldAlert, FolderOpen,
  HardDrive, Cloud, AlertTriangle, CheckCircle2, X, FileText, Send
} from 'lucide-react'
import { LiveKitCall } from './livekit-call'

type MeetingConfig = {
  storageMode: string
  localSavePath: string
  googleDriveFolderId: string
  allowRecording: boolean
  autoUploadToServer: boolean
  autoDownloadToBrowser: boolean
  fullScreenByDefault: boolean
  preferEmbeddedView: boolean
  sameTabOnly: boolean
}

type Booking = {
  id: string
  name: string
  email: string
  subject: string
  meetingMode: string
  meetingLink: string | null
  createdAt: string
  slot: {
    startTime: string
    endTime: string
    day: { date: string }
    physicalAddress: string | null
  }
}

type Recording = {
  id: string
  bookingId: string
  fileName: string
  filePath: string
  publicUrl: string | null
  storage: string
  createdAt: string
}

interface MeetingWorkspaceProps {
  booking: Booking
  meetingConfig: MeetingConfig
  recordings: Recording[]
  adminView?: boolean
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(date))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).format(new Date(value))
}

function formatDuration(seconds: number) {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')
  return `${hrs}:${mins}:${secs}`
}

// ─── Activity Logger ──────────────────────────────────────────────────────────
async function logActivity(bookingId: string, type: string, details: string) {
  try {
    await fetch('/api/admin/meeting-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, type, details }),
    })
  } catch {}
}

export function MeetingWorkspace({ booking, meetingConfig, recordings, adminView = false }: MeetingWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const dirHandleRef = useRef<FileSystemDirectoryHandle | null>(null)

  const [isRecording, setIsRecording] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'uploading' | 'completed' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [savedPath, setSavedPath] = useState(recordings[0]?.filePath || '')
  const [savedUrl, setSavedUrl] = useState(recordings[0]?.publicUrl || '')
  const [localRecordings, setLocalRecordings] = useState(recordings)
  const [meetingEnded, setMeetingEnded] = useState(false)
  const [endAlert, setEndAlert] = useState(false)
  const [activityAlerts, setActivityAlerts] = useState<{ id: string; msg: string; time: string }[]>([])
  const [localFolderName, setLocalFolderName] = useState<string>('')
  const [storageError, setStorageError] = useState<string | null>(null)
  const [adminEvents, setAdminEvents] = useState<any[]>([])

  // ── Notes + Minutes of Meeting ───────────────────────────────────────────────
  const notesStorageKey = `meeting-notes-${booking.id}`
  const [notes, setNotes] = useState('')
  const [extraRecipients, setExtraRecipients] = useState('')
  const [momStatus, setMomStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [momMessage, setMomMessage] = useState('')

  // Load any locally-saved notes for this meeting on mount.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(notesStorageKey)
      if (saved) setNotes(saved)
    } catch {}
  }, [notesStorageKey])

  // Persist notes locally as they change.
  useEffect(() => {
    try {
      window.localStorage.setItem(notesStorageKey, notes)
    } catch {}
  }, [notesStorageKey, notes])

  const sendMinutes = useCallback(async () => {
    setMomStatus('sending')
    setMomMessage('')
    try {
      const recipients = extraRecipients
        .split(/[,\s]+/)
        .map((r) => r.trim())
        .filter((r) => r.includes('@'))
      const res = await fetch('/api/meeting-mom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, notes, recipients }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send minutes')
      setMomStatus('sent')
      setMomMessage(
        `Sent to ${data.recipients?.length || 0} participant(s)${data.delivery === 'logged' ? ' (dev: logged to server console)' : ''}.`,
      )
      logActivity(booking.id, 'MOM_SENT', `Minutes of meeting emailed to ${data.recipients?.length || 0} participant(s)`)
    } catch (err: any) {
      setMomStatus('error')
      setMomMessage(err?.message || 'Could not send minutes of meeting')
    }
  }, [booking.id, notes, extraRecipients])

  // ── Meeting guard: warn before leaving ──────────────────────────────────────
  useEffect(() => {
    if (meetingEnded) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'The meeting is in progress. Leaving will end your session.'
      return e.returnValue
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [meetingEnded])

  // ── Block back navigation ────────────────────────────────────────────────────
  useEffect(() => {
    if (meetingEnded) return
    window.history.pushState(null, '', window.location.href)
    const handler = () => {
      window.history.pushState(null, '', window.location.href)
      setEndAlert(true)
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [meetingEnded])

  // ── Tab visibility / focus change logging ────────────────────────────────────
  useEffect(() => {
    if (meetingEnded) return
    const handleVisibility = () => {
      if (document.hidden) {
        const msg = 'User switched away from meeting tab'
        logActivity(booking.id, 'TAB_SWITCH', msg)
        const alert = { id: crypto.randomUUID(), msg, time: new Date().toLocaleTimeString('en-IN') }
        setActivityAlerts(prev => [alert, ...prev].slice(0, 10))
      }
    }
    const handleBlur = () => {
      const msg = 'Browser window lost focus during meeting'
      logActivity(booking.id, 'WINDOW_BLUR', msg)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleBlur)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
    }
  }, [booking.id, meetingEnded])

  // ── Log meeting start ────────────────────────────────────────────────────────
  useEffect(() => {
    logActivity(booking.id, 'MEETING_JOINED', `${adminView ? 'Admin' : 'Client'} opened workspace`)
  }, [booking.id, adminView])

  // ── Admin: poll activity log ─────────────────────────────────────────────────
  useEffect(() => {
    if (!adminView) return
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/meeting-activity?bookingId=${booking.id}`)
        const data = await res.json()
        setAdminEvents(data.events || [])
      } catch {}
    }
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [adminView, booking.id])

  // ── Recording timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRecording) return
    const timer = window.setInterval(() => setElapsedSeconds(s => s + 1), 1000)
    return () => window.clearInterval(timer)
  }, [isRecording])

  const requestFullscreen = async () => {
    if (!containerRef.current) return
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await containerRef.current.requestFullscreen()
    } catch {}
  }

  // ── Local folder picker (File System Access API) ─────────────────────────────
  const pickLocalFolder = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        setStorageError('Folder picker not supported in this browser. Use Chrome or Edge.')
        return
      }
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' })
      dirHandleRef.current = handle
      setLocalFolderName(handle.name)
      setStorageError(null)
    } catch (err: any) {
      if (err?.name !== 'AbortError') setStorageError('Could not access folder: ' + (err?.message || 'Permission denied'))
    }
  }

  // ── Save blob to local folder ────────────────────────────────────────────────
  const saveToLocalFolder = async (blob: Blob, fileName: string) => {
    if (!dirHandleRef.current) return false
    try {
      const fileHandle = await dirHandleRef.current.getFileHandle(fileName, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(blob)
      await writable.close()
      return true
    } catch (err: any) {
      if (err?.name === 'QuotaExceededError') {
        setStorageError('Not enough space on your local drive. Free up space and try again.')
      } else {
        setStorageError('Failed to save to local folder: ' + (err?.message || 'Unknown error'))
      }
      return false
    }
  }

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `meeting-${booking.id}-${Date.now()}.webm`
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const uploadBlob = (blob: Blob) => new Promise<{ filePath: string; publicUrl: string | null }>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/meeting-recordings')
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText)
        resolve({ filePath: response.filePath, publicUrl: response.publicUrl })
        return
      }
      const parsed = JSON.parse(xhr.responseText || '{}')
      reject(new Error(parsed.error || 'Upload failed'))
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    const formData = new FormData()
    formData.set('bookingId', booking.id)
    formData.set('file', new File([blob], `meeting-${booking.id}.webm`, { type: blob.type || 'video/webm' }))
    xhr.send(formData)
  })

  const finalizeRecording = async (blob: Blob) => {
    try {
      setStatus('processing')
      setStatusMessage('Preparing recording…')
      setStorageError(null)
      const fileName = `meeting-${booking.id}-${Date.now()}.webm`

      // Local folder save (if picker was used)
      if (dirHandleRef.current) {
        const saved = await saveToLocalFolder(blob, fileName)
        if (saved) setStatusMessage(`Saved to local folder: ${localFolderName}`)
      }

      // Browser download fallback
      if (!dirHandleRef.current && (meetingConfig.autoDownloadToBrowser || meetingConfig.storageMode === 'BROWSER' || meetingConfig.storageMode === 'BOTH')) {
        downloadBlob(blob)
      }

      // Server/cloud upload
      if (meetingConfig.autoUploadToServer || meetingConfig.storageMode === 'SERVER' || meetingConfig.storageMode === 'BOTH' || meetingConfig.storageMode === 'GOOGLE_DRIVE') {
        setStatus('uploading')
        setStatusMessage('Saving to server…')
        try {
          const uploaded = await uploadBlob(blob)
          setSavedPath(uploaded.filePath)
          setSavedUrl(uploaded.publicUrl || '')
          setLocalRecordings(prev => [
            { id: `local-${Date.now()}`, bookingId: booking.id, fileName, filePath: uploaded.filePath, publicUrl: uploaded.publicUrl, storage: meetingConfig.storageMode.toLowerCase(), createdAt: new Date().toISOString() },
            ...prev,
          ])
        } catch (uploadErr: any) {
          const msg = uploadErr?.message || 'Upload failed'
          if (msg.toLowerCase().includes('space') || msg.toLowerCase().includes('quota')) {
            setStorageError('Server storage is full. Recording was saved to browser download only.')
          } else {
            setStorageError(`Upload error: ${msg}`)
          }
        }
      }

      setStatus('completed')
      setStatusMessage('Recording saved.')
      logActivity(booking.id, 'RECORDING_SAVED', `Recording finalized for booking ${booking.id}`)
    } catch (error: any) {
      setStatus('error')
      setStatusMessage('Save failed')
      setStorageError(error?.message || 'Unknown error during save')
    }
  }

  const stopRecording = async () => {
    recorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    setIsRecording(false)
    setElapsedSeconds(0)
  }

  const startRecording = async () => {
    if (!meetingConfig.allowRecording) return
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      streamRef.current = stream
      recorderRef.current = recorder
      chunksRef.current = []
      setStatus('recording')
      setStatusMessage('Recording live session')
      setUploadProgress(0)

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        await finalizeRecording(blob)
      }
      recorder.start(1000)
      setIsRecording(true)
      logActivity(booking.id, 'RECORDING_STARTED', 'Screen recording started')
    } catch {
      setStatus('error')
      setStatusMessage('Recording permission denied')
    }
  }

  const endMeeting = useCallback(() => {
    if (isRecording) stopRecording()
    logActivity(booking.id, 'MEETING_ENDED', `${adminView ? 'Admin' : 'Client'} ended the meeting`)
    setMeetingEnded(true)
  }, [booking.id, adminView, isRecording])

  if (meetingEnded) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Meeting Ended</h2>
          <p className="text-slate-300 text-sm">This session has been closed. Thank you for using our virtual workspace.</p>
          {localRecordings.length > 0 && (
            <p className="text-primary text-xs font-semibold">{localRecordings.length} recording(s) saved.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-primary text-white">
      {/* End meeting alert */}
      {endAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-primary border border-red-500/30 rounded-3xl p-8 max-w-sm w-full mx-4 space-y-5 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
            <h3 className="text-lg font-black uppercase tracking-tight text-white">Leave Meeting?</h3>
            <p className="text-slate-300 text-sm">Leaving will end your session and this will be logged. The meeting should continue in this workspace only.</p>
            <div className="flex gap-3">
              <button onClick={() => setEndAlert(false)} className="flex-1 py-3 rounded-2xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-colors">
                Stay in Meeting
              </button>
              <button onClick={endMeeting} className="flex-1 py-3 rounded-2xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
                End Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              {adminView ? 'Admin Virtual Meeting' : 'Secure Meeting Workspace'}
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">
              {booking.meetingMode === 'PHYSICAL' ? 'In-Person Consultation' : 'Virtual Meeting Workspace'}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />{formatDate(booking.slot.day.date)}</span>
              <span className="inline-flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />{formatTime(booking.slot.startTime)} – {formatTime(booking.slot.endTime)}</span>
              <span className="inline-flex items-center gap-2"><Video className="w-4 h-4 text-primary" />{booking.meetingMode.replace('_', ' ')}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={requestFullscreen} className="rounded-2xl border border-white/15 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors">
              <span className="inline-flex items-center gap-2"><Maximize className="w-4 h-4" />Full Screen</span>
            </button>
            <button onClick={() => setEndAlert(true)} className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-colors">
              End Meeting
            </button>
          </div>
        </div>

        {/* Activity alerts (for current session) */}
        {activityAlerts.length > 0 && !adminView && (
          <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">
              <ShieldAlert className="w-4 h-4" /> Session Activity Alerts
            </div>
            {activityAlerts.slice(0, 3).map(a => (
              <div key={a.id} className="flex items-center justify-between text-xs text-amber-300">
                <span>{a.msg}</span><span className="text-amber-500">{a.time}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_0.9fr]">
          {/* Main stage */}
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 shadow-2xl">
            {booking.meetingMode === 'PHYSICAL' ? (
              <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4 p-8 text-center">
                <Monitor className="h-14 w-14 text-primary" />
                <h2 className="text-2xl font-black uppercase tracking-tighter">Office Visit Scheduled</h2>
                <p className="max-w-xl text-sm font-medium text-slate-300">{booking.slot.physicalAddress || 'The office address will be shared by the advocate team.'}</p>
              </div>
            ) : (
              <LiveKitCall
                room={booking.id}
                identity={adminView ? `advocate-${booking.id}` : `client-${booking.id}`}
                name={adminView ? 'Advocate' : booking.name}
                onDisconnected={endMeeting}
              />
            )}
          </div>

          {/* Right panel */}
          <div className="space-y-5">
            {/* Session info */}
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <div className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary">Session Info</div>
              <div className="space-y-3">
                <div className="rounded-2xl bg-black/20 p-3">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">Client</div>
                  <div className="mt-1 text-base font-bold">{booking.name}</div>
                  <div className="text-xs text-slate-300">{booking.email}</div>
                  <div className="text-xs text-slate-400 mt-1">{booking.subject}</div>
                </div>
              </div>
            </div>

            {/* Meeting notes + Minutes of Meeting */}
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                <FileText className="w-4 h-4" /> Meeting Notes
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type minutes / action items here. One point per line — they are auto-saved on this device."
                rows={6}
                className="w-full resize-y rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#F4E8D8] focus:outline-none"
              />
              <input
                value={extraRecipients}
                onChange={(e) => setExtraRecipients(e.target.value)}
                placeholder="Extra recipient emails (comma separated, optional)"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#F4E8D8] focus:outline-none"
              />
              <button
                onClick={sendMinutes}
                disabled={momStatus === 'sending'}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#F6F0E8] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-accent transition-colors disabled:opacity-60"
              >
                {momStatus === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Email Minutes to Joinees
              </button>
              {momMessage && (
                <p className={`text-xs ${momStatus === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>{momMessage}</p>
              )}
              <p className="text-[10px] text-slate-500">Sends notes + meeting details to the client, advocate, and any extra emails.</p>
            </div>

            {/* Recording controls */}
            {meetingConfig.allowRecording && (
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 space-y-4">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Recording</div>

                {/* Local folder picker */}
                <button
                  onClick={pickLocalFolder}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/10 bg-black/20 text-sm hover:bg-white/10 transition-colors"
                >
                  <FolderOpen className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-slate-200 truncate">
                    {localFolderName ? `📁 ${localFolderName}` : 'Pick Save Folder (local)'}
                  </span>
                </button>

                {storageError && (
                  <div className="flex items-start gap-2 rounded-2xl bg-red-500/10 border border-red-500/20 p-3">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300">{storageError}</p>
                    <button onClick={() => setStorageError(null)} className="ml-auto flex-shrink-0">
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                )}

                {!isRecording ? (
                  <button onClick={startRecording} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#F6F0E8] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-accent transition-colors">
                    <Mic className="w-4 h-4" />Start Recording
                  </button>
                ) : (
                  <button onClick={stopRecording} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-red-700 transition-colors">
                    Stop Recording
                  </button>
                )}

                <div className="flex items-center justify-between rounded-2xl bg-black/20 px-3 py-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Elapsed</span>
                  <span className="text-sm font-bold">{formatDuration(elapsedSeconds)}</span>
                </div>

                {status !== 'idle' && (
                  <div className="rounded-2xl bg-black/20 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black uppercase tracking-widest text-slate-400">Status</span>
                      <span className="font-bold text-white uppercase">{status}</span>
                    </div>
                    {status === 'uploading' && (
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full bg-[#F6F0E8] transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}
                    <p className="text-xs text-slate-300">{statusMessage}</p>
                    {savedPath && (
                      <div className="mt-2">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Saved Path</div>
                        <div className="break-all text-xs text-emerald-300">{savedPath}</div>
                        {savedUrl && (
                          <a href={savedUrl} className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                            <Download className="w-3.5 h-3.5" />Open File
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Storage indicator */}
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Storage Config</div>
              <div className="flex items-center gap-2 text-xs">
                {meetingConfig.storageMode === 'GOOGLE_DRIVE' ? <Cloud className="w-4 h-4 text-blue-400" /> : <HardDrive className="w-4 h-4 text-primary" />}
                <span className="font-semibold text-slate-200">{meetingConfig.storageMode}</span>
              </div>
              {meetingConfig.storageMode === 'GOOGLE_DRIVE' && !meetingConfig.googleDriveFolderId && (
                <p className="text-xs text-amber-400">Google Drive folder ID not configured. Go to Settings → Meeting Controls.</p>
              )}
              {localFolderName && (
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <Save className="w-3.5 h-3.5" />Local: {localFolderName}
                </div>
              )}
            </div>

            {/* Saved recordings */}
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <div className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary">Saved Recordings ({localRecordings.length})</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {localRecordings.length === 0 && (
                  <div className="rounded-2xl bg-black/20 p-3 text-xs font-medium text-slate-400">No recordings yet.</div>
                )}
                {localRecordings.map((r) => (
                  <div key={r.id} className="rounded-2xl bg-black/20 p-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                      <FileVideo className="w-3.5 h-3.5 text-primary" />{r.fileName}
                    </div>
                    <div className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleString('en-IN')}</div>
                    {r.publicUrl && (
                      <a href={r.publicUrl} className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary font-semibold">
                        <Download className="w-3 h-3" />Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Admin: live activity log */}
            {adminView && adminEvents.length > 0 && (
              <div className="rounded-[2rem] border border-amber-500/20 bg-amber-500/5 p-5">
                <div className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Activity Log (live)
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {adminEvents.slice(0, 20).map((e: any) => (
                    <div key={e.id} className="rounded-xl bg-black/20 p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">{e.type}</span>
                        <span className="text-[10px] text-slate-500">{new Date(e.timestamp).toLocaleTimeString('en-IN')}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{e.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
