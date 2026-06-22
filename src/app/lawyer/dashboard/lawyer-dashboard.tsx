'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import {
  Calendar, FileText, Users, AlertCircle, LogOut, X, User, ReceiptText,
  CalendarClock, ShieldCheck, Loader2, Plus, Trash2, Check, ChevronRight, Video, Mail,
} from 'lucide-react'
import { ReceiptsManager } from '@/components/receipts/receipts-manager'
import { NewCaseButton } from '../cases/[caseId]/case-actions'
import { MailClient } from '@/app/admin/(authenticated)/mail/mail-client'
import { ChangePasswordForm } from '@/components/lawyer/change-password-form'

type CaseItem = {
  id: string; caseNumber: string; title: string; clientName: string; status: string
  court: string; nextHearingDate: string | null
}
type AccessLogItem = { id: string; loginTime: string; ipAddress: string | null; userAgent: string | null }
type Advocate = {
  id: string; name: string; title: string; email: string; bio: string | null
  phone: string | null; expertise: string | null; education: string | null; barCouncilId: string | null
}
type Stats = { activeCases: number; upcomingHearings: number; totalDocuments: number; totalFeePaid: number }

interface Props {
  advocate: Advocate
  stats: Stats
  cases: CaseItem[]
  accessLogs: AccessLogItem[]
}

type ModalKey = null | 'profile' | 'cases' | 'receipts' | 'availability' | 'accesslog' | 'mail' | 'password'

const NAVY = '#14203E'

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8" onClick={onClose}>
      <div
        className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-2xl bg-white shadow-2xl ring-1 ring-[#F4E8D8]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#F4E8D8] px-5 py-4">
          <h3 className="text-lg font-bold text-[#14203E]">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#14203E]/60 hover:bg-[#F6F0E8]"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

export function LawyerDashboard({ advocate, stats, cases, accessLogs }: Props) {
  const [modal, setModal] = useState<ModalKey>(null)
  const close = useCallback(() => setModal(null), [])
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const doLogout = () => { setLoggingOut(true); signOut({ callbackUrl: '/lawyer/login' }) }

  const statCards = [
    { label: 'Active Cases', value: stats.activeCases, icon: FileText },
    { label: 'Upcoming Hearings', value: stats.upcomingHearings, icon: Calendar },
    { label: 'Total Documents', value: stats.totalDocuments, icon: FileText },
    { label: 'Total Fees Paid', value: `₹${stats.totalFeePaid.toLocaleString('en-IN')}`, icon: Users },
  ]

  const quickItems: { key: ModalKey; label: string; icon: any }[] = [
    { key: 'profile', label: 'Edit Profile', icon: User },
    { key: 'password', label: 'Change Password', icon: ShieldCheck },
    { key: 'cases', label: 'View All Cases', icon: FileText },
    { key: 'receipts', label: 'Generate Receipts', icon: ReceiptText },
    { key: 'mail', label: 'Mail (Gmail)', icon: Mail },
    { key: 'availability', label: 'Manage Availability', icon: CalendarClock },
    { key: 'accesslog', label: 'Access Log', icon: ShieldCheck },
  ]

  const upcoming = cases
    .filter((c) => c.nextHearingDate && new Date(c.nextHearingDate) > new Date())
    .sort((a, b) => new Date(a.nextHearingDate!).getTime() - new Date(b.nextHearingDate!).getTime())

  return (
    <div className="min-h-screen bg-[#FFFCF8]">
      {/* Header */}
      <div className="border-b border-[#F4E8D8] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#14203E]">{advocate.name}</h1>
            <p className="text-sm text-[#14203E]/60">{advocate.title}</p>
          </div>
          <button
            onClick={() => setConfirmLogout(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {statCards.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="rounded-2xl border border-[#F4E8D8] bg-white p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F6F0E8] text-[#14203E]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold text-[#14203E]">{s.value}</div>
                <div className="text-sm text-[#14203E]/60">{s.label}</div>
              </div>
            )
          })}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* My Cases */}
          <div className="overflow-hidden rounded-2xl border border-[#F4E8D8] bg-white">
            <div className="flex items-center justify-between border-b border-[#F4E8D8] px-5 py-4">
              <h2 className="text-lg font-bold text-[#14203E]">My Cases</h2>
              <div className="flex items-center gap-3">
                <NewCaseButton />
                <button onClick={() => setModal('cases')} className="text-sm font-semibold text-[#14203E] hover:underline">View All →</button>
              </div>
            </div>
            <div className="max-h-96 divide-y divide-[#F4E8D8] overflow-y-auto">
              {cases.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-[#14203E]/50">No cases assigned yet</div>
              ) : cases.slice(0, 5).map((c) => (
                <Link key={c.id} href={`/lawyer/cases/${c.id}`} className="flex items-start justify-between gap-3 px-5 py-4 hover:bg-[#FFFCF8]">
                  <div>
                    <div className="font-semibold text-[#14203E]">{c.caseNumber}</div>
                    <div className="text-sm text-[#14203E]/70">{c.title}</div>
                    <div className="mt-1 text-xs text-[#14203E]/50">Client: {c.clientName}</div>
                  </div>
                  <StatusPill status={c.status} />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Access */}
          <div className="overflow-hidden rounded-2xl border border-[#F4E8D8] bg-white">
            <div className="border-b border-[#F4E8D8] px-5 py-4">
              <h2 className="text-lg font-bold text-[#14203E]">Quick Access</h2>
            </div>
            <div className="space-y-3 p-5">
              {quickItems.map((q) => {
                const Icon = q.icon
                const cls = 'flex w-full items-center justify-between rounded-xl border border-[#F4E8D8] px-4 py-3 text-left font-medium text-[#14203E] transition hover:bg-[#F6F0E8]'
                const inner = (
                  <>
                    <span className="flex items-center gap-3"><Icon className="h-4 w-4 text-[#14203E]/70" /> {q.label}</span>
                    <ChevronRight className="h-4 w-4 text-[#14203E]/40" />
                  </>
                )
                // Mail opens as a full-page app in a new tab.
                if (q.key === 'mail') {
                  return <a key={q.label} href="/lawyer/mail" target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
                }
                return <button key={q.label} onClick={() => setModal(q.key)} className={cls}>{inner}</button>
              })}
            </div>
          </div>
        </div>

        {/* Upcoming hearings */}
        {upcoming.length > 0 && (
          <div className="rounded-2xl border border-[#F4E8D8] bg-white">
            <div className="border-b border-[#F4E8D8] px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-[#14203E]"><AlertCircle className="h-5 w-5 text-amber-500" /> Upcoming Court Hearings</h2>
            </div>
            <div className="divide-y divide-[#F4E8D8]">
              {upcoming.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-start justify-between px-5 py-4">
                  <div>
                    <div className="font-semibold text-[#14203E]">{c.caseNumber} — {c.title}</div>
                    <div className="mt-1 text-sm text-[#14203E]/60">Court: {c.court}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[#14203E]">{new Date(c.nextHearingDate!).toLocaleDateString('en-IN')}</div>
                    <div className="text-xs text-[#14203E]/50">{Math.ceil((new Date(c.nextHearingDate!).getTime() - Date.now()) / 86400000)} days away</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'profile' && <Modal title="Edit Profile" onClose={close}><ProfileForm advocate={advocate} onDone={close} /></Modal>}
      {modal === 'password' && <Modal title="Change Password" onClose={close}><ChangePasswordForm /></Modal>}
      {modal === 'cases' && (
        <Modal title="All Cases" onClose={close} wide>
          {cases.length === 0 ? <p className="py-8 text-center text-sm text-[#14203E]/50">No cases assigned.</p> : (
            <div className="divide-y divide-[#F4E8D8]">
              {cases.map((c) => (
                <Link key={c.id} href={`/lawyer/cases/${c.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-[#FFFCF8]">
                  <div>
                    <div className="font-semibold text-[#14203E]">{c.caseNumber} — {c.title}</div>
                    <div className="text-xs text-[#14203E]/50">{c.clientName} · {c.court}</div>
                  </div>
                  <StatusPill status={c.status} />
                </Link>
              ))}
            </div>
          )}
        </Modal>
      )}
      {modal === 'receipts' && <Modal title="Receipts" onClose={close} wide><ReceiptsManager /></Modal>}
      {modal === 'mail' && <Modal title="Mail" onClose={close} wide><MailClient basePath="/api/lawyer/mail" /></Modal>}

      {/* Logout confirmation */}
      {confirmLogout && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-4" onClick={() => !loggingOut && setConfirmLogout(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl ring-1 ring-[#F4E8D8]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50"><LogOut className="h-6 w-6 text-red-500" /></div>
            <h3 className="text-lg font-bold text-[#14203E]">Log out?</h3>
            <p className="mt-1 text-sm text-[#14203E]/60">You will need to sign in again to access the portal.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmLogout(false)} disabled={loggingOut} className="flex-1 rounded-xl border border-[#F4E8D8] py-2.5 text-sm font-semibold text-[#14203E] hover:bg-[#F6F0E8] disabled:opacity-60">Cancel</button>
              <button onClick={doLogout} disabled={loggingOut} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {loggingOut ? <><Loader2 className="h-4 w-4 animate-spin" /> Logging out…</> : 'Log out'}
              </button>
            </div>
          </div>
        </div>
      )}
      {modal === 'availability' && <Modal title="Manage Availability" onClose={close} wide><AvailabilityManager /></Modal>}
      {modal === 'accesslog' && (
        <Modal title="Access Log" onClose={close} wide>
          {accessLogs.length === 0 ? <p className="py-8 text-center text-sm text-[#14203E]/50">No login history.</p> : (
            <div className="divide-y divide-[#F4E8D8]">
              {accessLogs.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-[#14203E]">{new Date(l.loginTime).toLocaleString('en-IN')}</span>
                  <span className="text-[#14203E]/50">{l.ipAddress || 'unknown'}</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const cls = status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : status === 'CLOSED' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'
  return <span className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${cls}`}>{status}</span>
}

function ProfileForm({ advocate, onDone }: { advocate: Advocate; onDone: () => void }) {
  const [form, setForm] = useState({
    name: advocate.name, title: advocate.title || '', phone: advocate.phone || '',
    bio: advocate.bio || '', expertise: advocate.expertise || '', education: advocate.education || '',
    barCouncilId: advocate.barCouncilId || '',
  })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setBusy(true); setMsg('')
    try {
      const r = await fetch('/api/lawyer/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setMsg('Saved')
      setTimeout(() => { onDone(); location.reload() }, 700)
    } catch (e: any) { setMsg(e?.message || 'Could not save') }
    finally { setBusy(false) }
  }

  const field = 'w-full rounded-xl border border-[#F4E8D8] bg-white px-3 py-2.5 text-sm text-[#14203E] outline-none focus:border-[#14203E]'
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><label className="mb-1 block text-xs font-semibold text-[#14203E]/60">Name</label><input className={field} value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
        <div><label className="mb-1 block text-xs font-semibold text-[#14203E]/60">Title</label><input className={field} value={form.title} onChange={(e) => set('title', e.target.value)} /></div>
        <div><label className="mb-1 block text-xs font-semibold text-[#14203E]/60">Phone</label><input className={field} value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
        <div><label className="mb-1 block text-xs font-semibold text-[#14203E]/60">Bar Council ID</label><input className={field} value={form.barCouncilId} onChange={(e) => set('barCouncilId', e.target.value)} /></div>
      </div>
      <div><label className="mb-1 block text-xs font-semibold text-[#14203E]/60">Expertise</label><input className={field} value={form.expertise} onChange={(e) => set('expertise', e.target.value)} placeholder="Corporate, Criminal…" /></div>
      <div><label className="mb-1 block text-xs font-semibold text-[#14203E]/60">Education</label><input className={field} value={form.education} onChange={(e) => set('education', e.target.value)} /></div>
      <div><label className="mb-1 block text-xs font-semibold text-[#14203E]/60">Bio</label><textarea rows={3} className={field} value={form.bio} onChange={(e) => set('bio', e.target.value)} /></div>
      <div className="flex items-center justify-end gap-3 pt-1">
        {msg && <span className="text-sm text-emerald-600">{msg}</span>}
        <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#14203E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d2c52] disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save Profile
        </button>
      </div>
    </div>
  )
}

function AvailabilityManager() {
  const month = new Date().toISOString().slice(0, 7)
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ date: '', startTime: '10:00', endTime: '10:30', capacity: 1 })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [instantBusy, setInstantBusy] = useState(false)

  const startInstant = async () => {
    setInstantBusy(true)
    try {
      const r = await fetch('/api/lawyer/meeting/instant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject: 'Instant Consultation' }) })
      const d = await r.json()
      if (d.hostUrl) window.open(d.hostUrl, '_blank', 'noopener')
    } finally { setInstantBusy(false) }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/lawyer/availability?month=${month}`)
      const d = await r.json()
      const all = (d.days || []).flatMap((day: any) => (day.slots || []).map((s: any) => ({ ...s, date: day.date })))
      setSlots(all)
    } finally { setLoading(false) }
  }, [month])
  useEffect(() => { load() }, [load])

  const add = async () => {
    if (!form.date) { setErr('Pick a date'); return }
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/lawyer/availability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      load()
    } catch (e: any) { setErr(e?.message || 'Could not add slot') }
    finally { setBusy(false) }
  }
  const del = async (id: string) => {
    await fetch(`/api/lawyer/availability?slotId=${id}`, { method: 'DELETE' })
    setSlots((s) => s.filter((x) => x.id !== id))
  }

  const field = 'rounded-lg border border-[#F4E8D8] bg-white px-3 py-2 text-sm text-[#14203E] outline-none'
  return (
    <div className="space-y-4">
      {/* Instant video meeting */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-[#14203E]/15 bg-[#14203E] p-4 text-white sm:flex-row sm:items-center">
        <div>
          <div className="text-sm font-bold">Start an instant video meeting</div>
          <div className="text-xs text-white/60">Opens a secure LiveKit room you host right now.</div>
        </div>
        <button onClick={startInstant} disabled={instantBusy} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#14203E] hover:bg-white/90 disabled:opacity-60">
          {instantBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />} Start Meeting
        </button>
      </div>

      <div className="rounded-xl border border-[#F4E8D8] bg-[#FFFCF8] p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input type="date" className={field} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input type="time" className={field} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          <input type="time" className={field} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          <input type="number" min={1} className={field} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} placeholder="Capacity" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          {err && <span className="text-xs text-red-500">{err}</span>}
          <button onClick={add} disabled={busy} className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#14203E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d2c52] disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Slot
          </button>
        </div>
      </div>
      <div className="text-xs font-semibold uppercase tracking-wide text-[#14203E]/50">This month ({slots.length})</div>
      {loading ? <div className="flex items-center gap-2 py-6 text-sm text-[#14203E]/50"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div> :
        slots.length === 0 ? <p className="py-6 text-center text-sm text-[#14203E]/50">No slots this month.</p> : (
          <div className="divide-y divide-[#F4E8D8]">
            {slots.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <span className="text-[#14203E]">{new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {s.startTime}–{s.endTime}</span>
                <div className="flex items-center gap-2">
                  {(s.allowedModes || []).map((m: string) => (
                    <span key={m} className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${m === 'PHYSICAL' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {m === 'PHYSICAL' ? 'In-Person' : 'Virtual'}
                    </span>
                  ))}
                  <span className="text-xs text-[#14203E]/50">{s.bookedCount}/{s.capacity}</span>
                  <button onClick={() => del(s.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
