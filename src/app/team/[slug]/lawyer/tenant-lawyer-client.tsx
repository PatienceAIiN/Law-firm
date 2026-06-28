'use client'

import { useState, useEffect, useTransition } from 'react'
import { useUnreadCounts } from '@/hooks/use-unread-counts'
import { signOut } from 'next-auth/react'
import { LogOut, FileText, ShieldCheck, User as UserIcon, Loader2, Mail, Video, Plus, X, CalendarClock, Trash2, Link as LinkIcon, Check, Inbox, Edit, ReceiptText } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { PasswordInput } from '@/components/ui/password-input'
import { PushSettings } from '@/components/push-settings'
import { createAdvocateCase, deleteBooking, resendBookingEmail, updateAdvocateCase, deleteAdvocateCase } from './actions'
import { addLawyerSlot, deleteLawyerSlot } from './actions-availability'

type T = { id: string; slug: string; name: string }
type Adv = { id: string; name: string; email: string; title: string; bio: string | null; phone: string | null }
type CaseItem = { id: string; caseNumber: string; title: string; status: string; clientName: string }
type Log = { id: string; loginTime: string; ipAddress: string }
type BookingItem = { id: string; name: string; email: string; subject: string; meetingMode: string; status: string; startTime: string; meetingLink: string | null }
type Slot = { id: string; startTime: string; endTime: string; capacity: number; bookedCount: number; bookings: any[] }
type Day = { id: string; date: string; slots: Slot[] }

export function TenantLawyerClient({
  tenant,
  advocate,
  cases,
  accessLogs,
  bookings,
  days,
}: {
  tenant: T
  advocate: Adv
  cases: CaseItem[]
  accessLogs: Log[]
  bookings: BookingItem[]
  days: Day[]
}) {
  const [tab, setTab] = useState<'cases' | 'availability' | 'bookings' | 'settings'>('cases')
  const [copiedLink, setCopiedLink] = useState(false)
  const unread = useUnreadCounts()
  // Lightweight nav progress bar — set true on Link mousedown, cleared
  // either when the component unmounts (new route mounted) or by a 6s
  // safety timeout in case the navigation hangs (dev compile).
  const [navPending, setNavPending] = useState(false)
  useEffect(() => {
    if (!navPending) return
    const t = setTimeout(() => setNavPending(false), 6000)
    return () => clearTimeout(t)
  }, [navPending])

  useEffect(() => {
    const tabLabels: Record<string, string> = {
      cases: 'My Cases',
      availability: 'Availability',
      bookings: 'History / Bookings',
      settings: 'Settings',
    }
    const tabName = tabLabels[tab] || 'Portal'
    document.title = `${tabName} | ${advocate.name} | Advocate Portal | ${tenant.name}`
  }, [tab, advocate.name, tenant.name])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17]">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#11151f]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold text-primary dark:text-white">{advocate.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{advocate.title} · {tenant.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/team/${tenant.slug}`)
                setCopiedLink(true)
                setTimeout(() => setCopiedLink(false), 2000)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <LinkIcon className="h-3.5 w-3.5" />} Share Portal
            </button>
            <button
              onClick={async () => {
                const { confirmDialog } = await import('@/components/ui/confirm-dialog')
                if (await confirmDialog({ title: 'Log out?', message: 'You will be signed out of the lawyer portal.', confirmLabel: 'Log out' })) {
                  signOut({ callbackUrl: `/team/${tenant.slug}/lawyer/login` })
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      {navPending && (
        // Thin top progress bar — never blocks the page. Disappears the
        // moment Next mounts the destination route.
        <div className="fixed left-0 right-0 top-0 z-50 h-0.5 overflow-hidden bg-amber-200/40">
          <div className="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] bg-amber-500" style={{ animationName: 'slide' }} />
          <style jsx>{`@keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }`}</style>
        </div>
      )}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <InstantMeetingCard slug={tenant.slug} />

        <nav className="mb-6 mt-6 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
          {[
            { id: 'cases', label: 'My Cases', icon: FileText, count: cases.length },
            { id: 'availability', label: 'Availability', icon: CalendarClock },
            { id: 'bookings', label: 'History / Bookings', icon: Video, count: bookings.length },
            { id: 'settings', label: 'Settings', icon: ShieldCheck },
          ].map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-white text-primary shadow dark:bg-[#11151f] dark:text-white'
                    : 'text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
                {typeof t.count === 'number' && (
                  <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">{t.count}</span>
                )}
              </button>
            )
          })}

          {/* Cross-route links sit in the same strip so they look like tabs.
              They navigate to separate routes (their own pages) but match the
              tab styling for visual consistency. */}
          <Link
            href={`/team/${tenant.slug}/lawyer/inquiries`}
            prefetch
            onMouseDown={() => setNavPending(true)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-primary active:scale-[0.98] dark:text-slate-300 dark:hover:text-white"
          >
            <Inbox className="h-4 w-4" /> Inquiries
            {unread.inquiries > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{unread.inquiries > 99 ? '99+' : unread.inquiries}</span>
            )}
          </Link>
          <Link
            href={`/team/${tenant.slug}/lawyer/chats`}
            prefetch
            onMouseDown={() => setNavPending(true)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-primary active:scale-[0.98] dark:text-slate-300 dark:hover:text-white"
          >
            <Mail className="h-4 w-4" /> Chats
          </Link>
          <Link
            href={`/team/${tenant.slug}/lawyer/receipts`}
            prefetch
            onMouseDown={() => setNavPending(true)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-primary active:scale-[0.98] dark:text-slate-300 dark:hover:text-white"
          >
            <ReceiptText className="h-4 w-4" /> Receipts
            {(unread.payments + unread.receipts) > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{(unread.payments + unread.receipts) > 99 ? '99+' : unread.payments + unread.receipts}</span>
            )}
          </Link>
          <Link
            href={`/team/${tenant.slug}/lawyer/mail`}
            prefetch
            onMouseDown={() => setNavPending(true)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-primary active:scale-[0.98] dark:text-slate-300 dark:hover:text-white"
          >
            <Mail className="h-4 w-4" /> Mail
            {unread.mail > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{unread.mail > 99 ? '99+' : unread.mail}</span>
            )}
          </Link>
        </nav>

        {tab === 'cases' && <CasesTab cases={cases} slug={tenant.slug} />}
        { tab === 'availability' && <LawyerAvailabilityTab days={days} slug={tenant.slug} /> }
        { tab === 'bookings' && <BookingsTab bookings={bookings} slug={tenant.slug} /> }
        { tab === 'settings' && <SettingsTab basePath={`/team/${tenant.slug}/lawyer`} advocateId={advocate.id} logs={accessLogs} /> }
      </main>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f]">{children}</div>
}

function LawyerAvailabilityTab({ days, slug }: { days: Day[], slug: string }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [pending, start] = useTransition()
  const [modes, setModes] = useState<string>('VIRTUAL,PHYSICAL')
  const requiresAddress = modes.includes('PHYSICAL')

  const onAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const res = await addLawyerSlot(slug, fd)
      if (res.ok) {
        setModalOpen(false)
        setModes('VIRTUAL,PHYSICAL')
        router.refresh()
      } else {
        alert(res.error)
      }
    })
  }

  const onDelete = (slotId: string) => {
    start(async () => {
      const res = await deleteLawyerSlot(slug, slotId)
      if (!res.ok) { alert(res.error); return }
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent">
          <Plus className="h-4 w-4" /> Add Slot
        </button>
      </div>

      <div className="space-y-3">
        {days.length === 0 ? (
          <Card><p className="text-sm text-slate-500 text-center">No availability slots yet.</p></Card>
        ) : days.map((d) => (
          <div key={d.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{new Date(d.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</h3>
            {d.slots.length === 0 ? <p className="mt-2 text-xs text-slate-500">No slots.</p> : (
              <ul className="mt-3 space-y-2">
                {d.slots.map((s) => (
                  <li key={s.id} className="rounded-xl bg-slate-50 px-3 py-3 text-sm dark:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-slate-800 dark:text-slate-100">{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="ml-3 text-xs text-slate-500">{s.bookedCount}/{s.capacity} booked</span>
                        {s.bookedCount > 0 ? (
                          <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Booked</span>
                        ) : (
                          <span className="ml-2 inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">Available</span>
                        )}
                      </div>
                      <button
                        onClick={() => onDelete(s.id)}
                        disabled={pending}
                        className="rounded-md p-1 text-rose-500 hover:bg-rose-100 disabled:opacity-60"
                        title="Delete slot"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#11151f]" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary dark:text-white">Add Availability Slot</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>
            
            <form onSubmit={onAdd} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Date *</label>
                <input name="date" type="date" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Start Time *</label>
                  <input name="startTime" type="time" required defaultValue="10:00" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">End Time *</label>
                  <input name="endTime" type="time" required defaultValue="10:30" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Capacity (Seats) *</label>
                  <input name="capacity" type="number" min={1} defaultValue={1} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Meeting Mode *</label>
                  <select
                    name="modes"
                    required
                    value={modes}
                    onChange={(e) => setModes(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white"
                  >
                    <option value="VIRTUAL,PHYSICAL">Virtual & In-Person</option>
                    <option value="VIRTUAL">Virtual Only</option>
                    <option value="PHYSICAL">In-Person Only</option>
                  </select>
                </div>
              </div>
              {requiresAddress && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">In-person meeting address *</label>
                  <input
                    name="physicalAddress"
                    required
                    maxLength={250}
                    placeholder="Where clients should come to meet you (max 250 chars)"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white"
                  />
                </div>
              )}
              <button disabled={pending} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {pending ? 'Saving...' : 'Add Slot'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function InstantMeetingCard({ slug }: { slug: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const start = async () => {
    setBusy(true); setError('')
    try {
      const res = await fetch(`/team/${slug}/lawyer/api/meeting/instant`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subject: 'Instant Consultation' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not start meeting')
      if (data.hostUrl) window.open(data.hostUrl, '_blank', 'noopener')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-primary/15 bg-primary p-5 text-white sm:flex-row sm:items-center">
      <div>
        <div className="text-sm font-bold">Start an instant video meeting</div>
        <div className="text-xs text-white/60">Opens a secure room you host — share the link with your client.</div>
        {error && <div className="mt-2 rounded-lg bg-rose-500/20 px-2 py-1 text-xs text-rose-200">{error}</div>}
      </div>
      <button onClick={start} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-white/90 disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />} Start Meeting
      </button>
    </div>
  )
}

function CaseRow({ slug, c }: { slug: string; c: CaseItem }) {
  const router = useRouter()
  const [edit, setEdit] = useState(false)
  const [busy, start] = useTransition()

  const onSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const res = await updateAdvocateCase(slug, c.id, fd)
      if (!res.ok) { alert(res.error); return }
      setEdit(false); router.refresh()
    })
  }
  const onDel = async () => {
    const { confirmDialog } = await import('@/components/ui/confirm-dialog')
    if (!(await confirmDialog({ title: 'Delete case?', message: `Delete case "${c.title}"? This cannot be undone.`, confirmLabel: 'Delete' }))) return
    start(async () => {
      const res = await deleteAdvocateCase(slug, c.id)
      if (!res.ok) { alert(res.error); return }
      router.refresh()
    })
  }

  if (edit) {
    return (
      <li className="py-3">
        <form onSubmit={onSave} className="grid gap-2 sm:grid-cols-2">
          <input name="caseNumber" defaultValue={c.caseNumber} placeholder="Case #" required className="rounded-md border border-slate-300 px-2 py-1.5 text-xs dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <input name="title" defaultValue={c.title} placeholder="Title" required className="rounded-md border border-slate-300 px-2 py-1.5 text-xs dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <input name="court" placeholder="Court" required className="rounded-md border border-slate-300 px-2 py-1.5 text-xs dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <select name="status" defaultValue={c.status} className="rounded-md border border-slate-300 px-2 py-1.5 text-xs dark:border-white/15 dark:bg-white/5 dark:text-white">
            {['ACTIVE', 'PENDING', 'ADJOURNED', 'CLOSED', 'DISPOSED'].map((s) => <option key={s}>{s}</option>)}
          </select>
          <input name="clientName" defaultValue={c.clientName} placeholder="Client name" required className="sm:col-span-2 rounded-md border border-slate-300 px-2 py-1.5 text-xs dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setEdit(false)} className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">Cancel</button>
            <button disabled={busy} className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-accent disabled:opacity-60">
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-primary dark:text-white">{c.title}</p>
        <p className="mt-0.5 text-xs text-slate-500">#{c.caseNumber} · {c.clientName} · {c.status}</p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => setEdit(true)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10" title="Edit">
          <Edit className="h-4 w-4" />
        </button>
        <button onClick={onDel} disabled={busy} className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50 disabled:opacity-60" title="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  )
}

function CasesTab({ cases, slug }: { cases: CaseItem[], slug: string }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const formData = new FormData(e.currentTarget)
      await createAdvocateCase(slug, formData)
      setModalOpen(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent"
        >
          <Plus className="h-4 w-4" /> Add Case
        </button>
      </div>

      <Card>
        {cases.length === 0 ? (
          <p className="text-sm text-slate-500">No cases assigned to you yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {cases.map((c) => (
              <CaseRow key={c.id} slug={slug} c={c} />
            ))}
          </ul>
        )}
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#11151f]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary dark:text-white" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">New case</h3>
            </div>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3 text-sm">
              <input name="caseNumber" required placeholder="Case #" className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              <input name="title" required placeholder="Title" className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              <select name="caseType" defaultValue="Civil" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white">
                {['Civil', 'Criminal', 'Family', 'Property', 'Labour', 'Corporate'].map((x) => <option key={x}>{x}</option>)}
              </select>
              <select name="status" defaultValue="ACTIVE" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white">
                {['ACTIVE', 'PENDING', 'ADJOURNED', 'CLOSED', 'DISPOSED'].map((x) => <option key={x}>{x}</option>)}
              </select>
              <input name="court" required placeholder="Court" className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              <input name="clientName" required placeholder="Client name" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              <input name="clientEmail" type="email" placeholder="Client email" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              <input name="clientPhone" placeholder="Client phone" className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              <input name="nextHearingDate" type="date" className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              {error && <div className="col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}
              <div className="col-span-2 flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">Cancel</button>
                <button disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-accent disabled:opacity-60">
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Create case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function SettingsTab({ basePath, advocateId, logs }: { basePath: string, advocateId: string, logs: Log[] }) {
  const [currentPassword, setCurrent] = useState('')
  const [newPassword, setNew] = useState('')
  const [confirmPassword, setConfirm] = useState('')
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus(null)
    if (newPassword !== confirmPassword) { setStatus({ type: 'error', message: 'Passwords do not match' }); return }
    if (newPassword.length < 8) { setStatus({ type: 'error', message: 'At least 8 characters' }); return }
    setLoading(true)
    try {
      const res = await fetch(`${basePath}/api/change-password`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password')
      setStatus({ type: 'success', message: 'Password updated.' })
      setCurrent(''); setNew(''); setConfirm('')
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Change password</h3>
            <p className="mt-1 text-sm text-slate-500">At least 8 characters.</p>
          </div>
          <PasswordInput placeholder="Current password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <PasswordInput placeholder="New password" value={newPassword} onChange={(e) => setNew(e.target.value)} required minLength={8} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <PasswordInput placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirm(e.target.value)} required minLength={8} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-white" />
          {status && <div className={`rounded-lg px-3 py-2 text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{status.message}</div>}
          <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </Card>

      <Card>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Email Integration</h3>
          <p className="mt-1 text-sm text-slate-500 mb-4">Connect your Google Workspace to send and receive client emails directly.</p>
          <Link
            href={`${basePath}/mail`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            <Mail className="h-4 w-4" /> Go to Mail / Configure
          </Link>
        </div>
      </Card>

      <Card>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Access Logs</h3>
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">No access logs yet.</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-white/10">
              {logs.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-700 dark:text-slate-200">{new Date(l.loginTime).toLocaleString()}</span>
                  <span className="text-xs text-slate-500">{l.ipAddress || 'unknown'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  )
}

function BookingsTab({ bookings, slug }: { bookings: BookingItem[], slug: string }) {
  const [busy, setBusy] = useState<{ id: string, type: 'delete' | 'resend' } | null>(null)

  const handleDelete = async (id: string) => {
    const { confirmDialog } = await import('@/components/ui/confirm-dialog')
    if (!(await confirmDialog({ title: 'Delete booking?', message: 'The client will not be notified.', confirmLabel: 'Delete' }))) return
    setBusy({ id, type: 'delete' })
    try {
      await deleteBooking(slug, id)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setBusy(null)
    }
  }

  const handleResend = async (id: string) => {
    setBusy({ id, type: 'resend' })
    try {
      await resendBookingEmail(slug, id)
      alert('Email sent successfully')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setBusy(null)
    }
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-500">No bookings scheduled yet.</p>
      </Card>
    )
  }
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/5">
            <tr>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-left">Client</th>
              <th className="px-3 py-2 text-left">Subject</th>
              <th className="px-3 py-2 text-left">Mode</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="px-3 py-2 text-slate-900 dark:text-white font-medium whitespace-nowrap">
                  {new Date(b.startTime).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                  <div>{b.name}</div>
                  <div className="text-xs text-slate-400">{b.email}</div>
                </td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{b.subject}</td>
                <td className="px-3 py-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    {b.meetingMode}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    {b.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {(b.meetingMode === 'GOOGLE_MEET' || b.meetingMode === 'ZOOM') && b.meetingLink ? (
                      <a href={b.meetingLink} target="_blank" rel="noopener noreferrer" className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400">
                        Join
                      </a>
                    ) : b.meetingMode === 'LIVEKIT' ? (
                      <Link href={`/meeting/${b.id}?admin=1`} target="_blank" rel="noopener noreferrer" className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400">
                        Host Room
                      </Link>
                    ) : null}
                    
                    <button
                      onClick={() => handleResend(b.id)}
                      disabled={busy?.id === b.id}
                      className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 disabled:opacity-50 dark:bg-blue-500/10 dark:text-blue-400"
                    >
                      {busy?.id === b.id && busy.type === 'resend' ? '...' : 'Resend'}
                    </button>

                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={busy?.id === b.id}
                      className="rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-500/10 dark:text-rose-400"
                    >
                      {busy?.id === b.id && busy.type === 'delete' ? '...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
