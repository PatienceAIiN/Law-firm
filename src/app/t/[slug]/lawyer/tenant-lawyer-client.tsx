'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { LogOut, FileText, ShieldCheck, User as UserIcon, Loader2, Mail, Video, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { PasswordInput } from '@/components/ui/password-input'
import { createAdvocateCase, deleteBooking, resendBookingEmail } from './actions'

type T = { id: string; slug: string; name: string }
type Adv = { id: string; name: string; email: string; title: string; bio: string | null; phone: string | null }
type CaseItem = { id: string; caseNumber: string; title: string; status: string; clientName: string }
type Log = { id: string; loginTime: string; ipAddress: string }
type BookingItem = { id: string; name: string; email: string; subject: string; meetingMode: string; status: string; startTime: string; meetingLink: string | null }

export function TenantLawyerClient({
  tenant,
  advocate,
  cases,
  accessLogs,
  bookings,
}: {
  tenant: T
  advocate: Adv
  cases: CaseItem[]
  accessLogs: Log[]
  bookings: BookingItem[]
}) {
  const [tab, setTab] = useState<'cases' | 'password' | 'access' | 'bookings'>('cases')

  useEffect(() => {
    const tabLabels: Record<string, string> = {
      cases: 'My Cases',
      bookings: 'History / Bookings',
      password: 'Change Password',
      access: 'Access Log',
    }
    const tabName = tabLabels[tab] || 'Portal'
    document.title = `${tabName} | ${advocate.name} | Advocate Portal | ${tenant.name}`
  }, [tab, advocate.name, tenant.name])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17]">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#11151f]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold text-[var(--primary)] dark:text-white">{advocate.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{advocate.title} · {tenant.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href={`/t/${tenant.slug}/lawyer/mail`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <Mail className="h-3.5 w-3.5" /> Mail
            </Link>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to log out?')) {
                  signOut({ callbackUrl: `/t/${tenant.slug}/lawyer/login` })
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <InstantMeetingCard slug={tenant.slug} />

        <nav className="mb-6 mt-6 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
          {[
            { id: 'cases', label: 'My Cases', icon: FileText, count: cases.length },
            { id: 'bookings', label: 'History / Bookings', icon: Video, count: bookings.length },
            { id: 'password', label: 'Change Password', icon: ShieldCheck },
            { id: 'access', label: 'Access Log', icon: UserIcon, count: accessLogs.length },
          ].map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-white text-[var(--primary)] shadow dark:bg-[#11151f] dark:text-white'
                    : 'text-slate-600 hover:text-[var(--primary)] dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
                {typeof t.count === 'number' && (
                  <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">{t.count}</span>
                )}
              </button>
            )
          })}
        </nav>

        {tab === 'cases' && <CasesTab cases={cases} slug={tenant.slug} />}
        {tab === 'bookings' && <BookingsTab bookings={bookings} slug={tenant.slug} />}
        {tab === 'password' && <PasswordTab basePath={`/t/${tenant.slug}/lawyer`} />}
        {tab === 'access' && <AccessTab logs={accessLogs} />}
      </main>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f]">{children}</div>
}

function InstantMeetingCard({ slug }: { slug: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const start = async () => {
    setBusy(true); setError('')
    try {
      const res = await fetch(`/t/${slug}/lawyer/api/meeting/instant`, {
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
    <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-[var(--primary)]/15 bg-[var(--primary)] p-5 text-white sm:flex-row sm:items-center">
      <div>
        <div className="text-sm font-bold">Start an instant video meeting</div>
        <div className="text-xs text-white/60">Opens a secure room you host — share the link with your client.</div>
        {error && <div className="mt-2 rounded-lg bg-rose-500/20 px-2 py-1 text-xs text-rose-200">{error}</div>}
      </div>
      <button onClick={start} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[var(--primary)] hover:bg-white/90 disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />} Start Meeting
      </button>
    </div>
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
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent)]"
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
              <li key={c.id} className="py-3">
                <p className="text-sm font-semibold text-[var(--primary)] dark:text-white">{c.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">#{c.caseNumber} · {c.clientName} · {c.status}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#11151f]" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--primary)] dark:text-white">Add New Case</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Case Number *</label>
                  <input name="caseNumber" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)] dark:border-white/15 dark:bg-white/5 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Case Type</label>
                  <input name="caseType" defaultValue="Civil" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)] dark:border-white/15 dark:bg-white/5 dark:text-white" />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Title / Description *</label>
                  <input name="title" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)] dark:border-white/15 dark:bg-white/5 dark:text-white" />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Court *</label>
                  <input name="court" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)] dark:border-white/15 dark:bg-white/5 dark:text-white" />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Client Name *</label>
                  <input name="clientName" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)] dark:border-white/15 dark:bg-white/5 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Client Email</label>
                  <input name="clientEmail" type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)] dark:border-white/15 dark:bg-white/5 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Client Phone</label>
                  <input name="clientPhone" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--primary)] dark:border-white/15 dark:bg-white/5 dark:text-white" />
                </div>
              </div>
              {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
              <button disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent)] disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? 'Saving...' : 'Add Case'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function PasswordTab({ basePath }: { basePath: string }) {
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
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Change password</h3>
          <p className="mt-1 text-sm text-slate-500">At least 8 characters.</p>
        </div>
        <PasswordInput placeholder="Current password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-white" />
        <PasswordInput placeholder="New password" value={newPassword} onChange={(e) => setNew(e.target.value)} required minLength={8} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-white" />
        <PasswordInput placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirm(e.target.value)} required minLength={8} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-white" />
        {status && <div className={`rounded-lg px-3 py-2 text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{status.message}</div>}
        <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent)] disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </Card>
  )
}

function AccessTab({ logs }: { logs: Log[] }) {
  if (logs.length === 0) return <Card><p className="text-sm text-slate-500">No access logs yet.</p></Card>
  return (
    <Card>
      <ul className="divide-y divide-slate-200 dark:divide-white/10">
        {logs.map((l) => (
          <li key={l.id} className="flex items-center justify-between py-2 text-sm">
            <span className="text-slate-700 dark:text-slate-200">{new Date(l.loginTime).toLocaleString()}</span>
            <span className="text-xs text-slate-500">{l.ipAddress || 'unknown'}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function BookingsTab({ bookings, slug }: { bookings: BookingItem[], slug: string }) {
  const [busy, setBusy] = useState<{ id: string, type: 'delete' | 'resend' } | null>(null)

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return
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
