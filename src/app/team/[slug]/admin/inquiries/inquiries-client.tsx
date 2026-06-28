'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { assignInquiry, replyInquiry, setInquiryStatus, deleteInquiry } from './actions'
import { Loader2, Reply, X, Send, Archive, CheckCircle2 } from 'lucide-react'
import { DeleteButton } from '@/components/ui/delete-button'
import { markSeen } from '@/hooks/use-unread-counts'

type Advocate = { id: string; name: string }
type Inquiry = {
  id: string
  fullName: string
  email: string
  phone?: string | null
  subject: string
  message: string
  status: string
  createdAt: Date | string
  advocateId: string | null
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'NEW', label: 'New' },
  { id: 'ASSIGNED', label: 'Assigned' },
  { id: 'REPLIED', label: 'Replied' },
  { id: 'ARCHIVED', label: 'Archived' },
] as const

export function TenantInquiriesClient({ slug, items, advocates }: { slug: string; items: Inquiry[]; advocates: Advocate[] }) {
  useEffect(() => { markSeen('inquiries') }, [])
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('all')
  const [pending, start] = useTransition()
  const [open, setOpen] = useState<Inquiry | null>(null)
  const router = useRouter()

  const filtered = items.filter((i) => (tab === 'all' ? true : i.status === tab))

  const handleAssign = (inquiryId: string, advocateId: string) => {
    start(async () => {
      try { await assignInquiry(slug, inquiryId, advocateId || null); router.refresh() }
      catch (err: any) { alert(err.message || 'Failed to assign') }
    })
  }

  const handleSetStatus = (inquiryId: string, status: string) => {
    start(async () => {
      try { await setInquiryStatus(slug, inquiryId, status); router.refresh() }
      catch (err: any) { alert(err.message || 'Failed') }
    })
  }

  const counts = TABS.reduce<Record<string, number>>((acc, t) => {
    acc[t.id] = t.id === 'all' ? items.length : items.filter((i) => i.status === t.id).length
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                active ? 'bg-white text-primary shadow dark:bg-[#11151f] dark:text-white' : 'text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {t.label}
              <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">{counts[t.id] ?? 0}</span>
            </button>
          )
        })}
      </nav>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No inquiries here.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {filtered.map((i) => {
              const assigned = advocates.find((a) => a.id === i.advocateId)
              return (
                <li key={i.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary dark:text-white">
                        {i.fullName} <span className="ml-2 text-xs font-normal text-slate-500">{i.email}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{i.subject} · {new Date(i.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        i.status === 'NEW' ? 'bg-amber-100 text-amber-800' :
                        i.status === 'ASSIGNED' ? 'bg-sky-100 text-sky-800' :
                        i.status === 'REPLIED' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {i.status}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-700 dark:text-slate-200">{i.message}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500">Assign:</span>
                    <select
                      disabled={pending}
                      value={i.advocateId || ''}
                      onChange={(e) => handleAssign(i.id, e.target.value)}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-white"
                    >
                      <option value="">Unassigned (Firm)</option>
                      {advocates.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                    {assigned && <span className="text-[10px] uppercase tracking-widest text-slate-400">→ {assigned.name}</span>}
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => setOpen(i)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-accent"
                      >
                        <Reply className="h-3 w-3" /> Open & reply
                      </button>
                      <DeleteButton
                        onDelete={() => deleteInquiry(slug, i.id)}
                        confirmMessage={`Delete inquiry from ${i.fullName}? This cannot be undone.`}
                        className="rounded-md p-1 text-rose-500 hover:bg-rose-50"
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {open && (
        <InquiryModal
          slug={slug}
          inquiry={open}
          onClose={() => setOpen(null)}
          onReplied={() => { setOpen(null); router.refresh() }}
          onArchive={() => { handleSetStatus(open.id, 'ARCHIVED'); setOpen(null) }}
        />
      )}
    </div>
  )
}

function InquiryModal({
  slug, inquiry, onClose, onReplied, onArchive,
}: {
  slug: string
  inquiry: Inquiry
  onClose: () => void
  onReplied: () => void
  onArchive: () => void
}) {
  const [body, setBody] = useState('')
  const [sending, start] = useTransition()
  const [error, setError] = useState('')

  const send = () => {
    setError('')
    if (body.trim().length < 5) { setError('Write a few words first.'); return }
    start(async () => {
      try { await replyInquiry(slug, inquiry.id, body); onReplied() }
      catch (e: any) { setError(e.message || 'Failed to send') }
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#11151f]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-primary dark:text-white">{inquiry.subject}</h3>
            <p className="mt-0.5 text-xs text-slate-500">From {inquiry.fullName} &lt;{inquiry.email}&gt;{inquiry.phone ? ` · ${inquiry.phone}` : ''}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">
          <p className="whitespace-pre-wrap">{inquiry.message}</p>
        </div>

        <div className="mt-5">
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Reply via email</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder={`Hi ${inquiry.fullName},\n\nThanks for reaching out…`}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[#14203E]/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
          />
          {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button onClick={onArchive} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
              <Archive className="h-3.5 w-3.5" /> Archive
            </button>
            <button
              onClick={send}
              disabled={sending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send reply
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
