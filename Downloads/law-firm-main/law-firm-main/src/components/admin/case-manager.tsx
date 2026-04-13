'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CalendarDays, CheckCircle2, Eye, FileText, Loader2, Pencil, Plus, Search, Send, Shield, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminDialog } from './admin-dialog'

type Advocate = { id: string; name: string; email: string }
type CourtCase = {
  id: string
  caseNumber: string
  title: string
  caseType: string
  status: string
  court: string
  judge?: string | null
  clientName: string
  clientEmail: string
  clientPhone?: string | null
  opposingParty?: string | null
  advocateId?: string | null
  advocate?: Advocate | null
  filingDate?: string | null
  nextHearingDate?: string | null
  courtAppearanceDate?: string | null
  description?: string | null
  emailControl?: string
  sendReminder?: boolean
  reminderSentOn?: string | null
  documents: Array<{ id: string; name: string; fileUrl: string }>
  payments: Array<{ id: string; amount: number; mode?: string; paymentDate?: string }>
}

function normalizeCase(item: CourtCase): CourtCase {
  return {
    ...item,
    documents: item.documents ?? [],
    payments: item.payments ?? [],
  }
}

type FormState = {
  caseNumber: string
  title: string
  caseType: string
  status: string
  court: string
  judge: string
  clientName: string
  clientEmail: string
  clientPhone: string
  opposingParty: string
  advocateId: string
  filingDate: string
  nextHearingDate: string
  courtAppearanceDate: string
  description: string
  emailControl: string
  sendReminder: boolean
}

const CASE_TYPES = ['Civil', 'Criminal', 'Family', 'Property', 'Labour', 'Constitutional', 'Commercial', 'Revenue', 'Consumer', 'Motor Accident', 'Writ', 'Arbitration', 'Other']
const STATUSES = ['ACTIVE', 'PENDING', 'ADJOURNED', 'CLOSED', 'DISPOSED']
const EMAIL_CONTROLS = [
  { value: 'NONE', label: 'No client email' },
  { value: 'DETAILS_ONLY', label: 'Case details' },
  { value: 'BILL_ONLY', label: 'Bill / receipt' },
  { value: 'BOTH', label: 'Details + bill' },
]
const TABS = ['all', 'active', 'upcoming', 'assigned', 'closed'] as const
const EMPTY_FORM: FormState = {
  caseNumber: '',
  title: '',
  caseType: 'Civil',
  status: 'ACTIVE',
  court: '',
  judge: '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  opposingParty: '',
  advocateId: '',
  filingDate: '',
  nextHearingDate: '',
  courtAppearanceDate: '',
  description: '',
  emailControl: 'NONE',
  sendReminder: true,
}

function toDate(value?: string | null) {
  return value ? value.slice(0, 10) : ''
}

function isUrgent(item: CourtCase) {
  const target = item.courtAppearanceDate || item.nextHearingDate
  if (!target) return false
  const diff = new Date(target).getTime() - Date.now()
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000
}

function fmtDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : 'Not set'
}

const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#0a192f]/10'

export function CaseManager() {
  const [cases, setCases] = useState<CourtCase[]>([])
  const [advocates, setAdvocates] = useState<Advocate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<(typeof TABS)[number]>('all')
  const [preview, setPreview] = useState<CourtCase | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [caseRes, advocateRes] = await Promise.all([fetch('/api/cases?limit=200&page=1'), fetch('/api/advocates')])
        const caseData = await caseRes.json()
        const advocateData = await advocateRes.json()
        if (!caseRes.ok) throw new Error(caseData.error || 'Failed to load cases')
        if (!advocateRes.ok) throw new Error(advocateData.error || 'Failed to load advocates')
        setCases((caseData.cases || []).map(normalizeCase))
        setAdvocates(advocateData || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load case management data')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return cases.filter((item) => {
      const matchesSearch =
        !term ||
        [item.caseNumber, item.title, item.clientName, item.clientEmail, item.court, item.advocate?.name || '']
          .join(' ')
          .toLowerCase()
          .includes(term)
      const matchesTab =
        tab === 'all'
          ? true
          : tab === 'active'
            ? item.status === 'ACTIVE'
            : tab === 'closed'
              ? item.status === 'CLOSED' || item.status === 'DISPOSED'
              : tab === 'assigned'
                ? Boolean(item.advocateId)
                : isUrgent(item)
      return matchesSearch && matchesTab
    })
  }, [cases, search, tab])

  const stats = useMemo(() => ({
    total: cases.length,
    active: cases.filter((item) => item.status === 'ACTIVE').length,
    assigned: cases.filter((item) => Boolean(item.advocateId)).length,
    urgent: cases.filter(isUrgent).length,
  }), [cases])

  const openCreate = () => {
    setEditorMode('create')
    setEditingId(null)
    setForm(EMPTY_FORM)
    setEditorOpen(true)
  }

  const openEdit = (item: CourtCase) => {
    setEditorMode('edit')
    setEditingId(item.id)
    setForm({
      caseNumber: item.caseNumber,
      title: item.title,
      caseType: item.caseType,
      status: item.status,
      court: item.court,
      judge: item.judge || '',
      clientName: item.clientName,
      clientEmail: item.clientEmail,
      clientPhone: item.clientPhone || '',
      opposingParty: item.opposingParty || '',
      advocateId: item.advocateId || '',
      filingDate: toDate(item.filingDate),
      nextHearingDate: toDate(item.nextHearingDate),
      courtAppearanceDate: toDate(item.courtAppearanceDate),
      description: item.description || '',
      emailControl: item.emailControl || 'NONE',
      sendReminder: item.sendReminder !== false,
    })
    setEditorOpen(true)
  }

  const save = async () => {
    if (!form.caseNumber || !form.title || !form.clientName || !form.clientEmail || !form.court) {
      setError('Case number, title, client name, client email, and court are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        advocateId: form.advocateId || null,
        filingDate: form.filingDate || null,
        nextHearingDate: form.nextHearingDate || null,
        courtAppearanceDate: form.courtAppearanceDate || null,
      }
      const res = await fetch(editorMode === 'create' ? '/api/cases' : `/api/cases/${editingId}`, {
        method: editorMode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save case')
        setCases((current) => editorMode === 'create' ? [normalizeCase(data), ...current] : current.map((item) => (item.id === data.id ? normalizeCase({ ...item, ...data }) : item)))
      setEditorOpen(false)
    } catch (err: any) {
      setError(err.message || 'Failed to save case')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item: CourtCase) => {
    if (!window.confirm(`Delete case ${item.caseNumber}?`)) return
    setSaving(true)
    try {
      const res = await fetch(`/api/cases/${item.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete case')
      setCases((current) => current.filter((entry) => entry.id !== item.id))
      if (preview?.id === item.id) setPreview(null)
    } catch (err: any) {
      setError(err.message || 'Failed to delete case')
    } finally {
      setSaving(false)
    }
  }

  const reminder = async (item: CourtCase) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/cases/${item.id}/send-reminder`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send reminder')
      window.alert(`Reminder sent to ${data.sentTo || item.advocate?.email || item.clientEmail}`)
      setPreview((current) => current && current.id === item.id ? { ...current, reminderSentOn: new Date().toISOString() } : current)
    } catch (err: any) {
      setError(err.message || 'Failed to send reminder')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#c5a059]">Case Management</p>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-[#0a192f]">Digital court file system</h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">Create, preview, update, and delete files. Assign advocates, store case documents, record payments, and trigger reminders from one place.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={openCreate} className="h-11 rounded-2xl bg-[#0a192f] px-5 font-black uppercase tracking-widest text-white hover:bg-[#c5a059] hover:text-[#0a192f]"><Plus className="mr-2 h-4 w-4" />Add Case</Button>
            <Link href="/admin/cases/new" className="inline-flex h-11 items-center rounded-2xl border border-slate-200 px-5 text-[10px] font-black uppercase tracking-[0.24em] text-slate-600 hover:border-[#0a192f] hover:text-[#0a192f]">Full Form</Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            { label: 'Total Cases', value: stats.total, icon: FileText, color: 'text-[#0a192f]' },
            { label: 'Active', value: stats.active, icon: Shield, color: 'text-emerald-600' },
            { label: 'Assigned', value: stats.assigned, icon: Users, color: 'text-blue-600' },
            { label: 'Urgent', value: stats.urgent, icon: AlertCircle, color: 'text-amber-600' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <div className={`mt-3 text-2xl font-black ${item.color}`}>{item.value}</div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search case number, client, court, advocate..." className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#0a192f]/10" />
          </div>
          <div className="flex flex-wrap gap-2">
            {TABS.map((item) => (
              <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] ${tab === item ? 'bg-[#0a192f] text-white' : 'border border-slate-200 bg-white text-slate-500 hover:border-[#0a192f] hover:text-[#0a192f]'}`}>
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-[#0a192f]" />Loading cases...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">No cases found for the selected filter.</div>
        ) : filtered.map((item) => {
          const paid = (item.payments ?? []).reduce((sum, payment) => sum + payment.amount, 0)
          return (
            <div key={item.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{item.caseNumber}</span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-600">{item.caseType}</span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-600">{item.status}</span>
                    {isUrgent(item) && <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-700"><CalendarDays className="h-3 w-3" />Urgent</span>}
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-[#0a192f]">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{item.clientName} - {item.court}</p>
                  </div>
                  <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                    <Info label="Advocate" value={item.advocate?.name || 'Unassigned'} />
                    <Info label="Next Hearing" value={fmtDate(item.nextHearingDate)} />
                    <Info label="Fees" value={`INR ${paid.toLocaleString('en-IN')}`} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => setPreview(item)} className="h-10 rounded-2xl border-slate-200 px-4 text-[10px] font-black uppercase tracking-[0.24em] text-slate-600"><Eye className="mr-2 h-4 w-4" />Preview</Button>
                  <Button type="button" variant="outline" onClick={() => openEdit(item)} className="h-10 rounded-2xl border-slate-200 px-4 text-[10px] font-black uppercase tracking-[0.24em] text-slate-600"><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                  <Button type="button" variant="outline" onClick={() => remove(item)} className="h-10 rounded-2xl border-red-200 px-4 text-[10px] font-black uppercase tracking-[0.24em] text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <AdminDialog isOpen={editorOpen} onClose={() => setEditorOpen(false)} title={editorMode === 'create' ? 'Add Case' : 'Update Case'} description="Create and maintain the court record" isLoading={saving}>
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Case Number"><input value={form.caseNumber} onChange={(e) => setForm((c) => ({ ...c, caseNumber: e.target.value }))} className={inputClass} /></Field>
            <Field label="Case Type"><select value={form.caseType} onChange={(e) => setForm((c) => ({ ...c, caseType: e.target.value }))} className={inputClass}>{CASE_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
            <Field label="Title"><input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} className={inputClass} /></Field>
            <Field label="Status"><select value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))} className={inputClass}>{STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
            <Field label="Court"><input value={form.court} onChange={(e) => setForm((c) => ({ ...c, court: e.target.value }))} className={inputClass} /></Field>
            <Field label="Judge"><input value={form.judge} onChange={(e) => setForm((c) => ({ ...c, judge: e.target.value }))} className={inputClass} /></Field>
            <Field label="Client Name"><input value={form.clientName} onChange={(e) => setForm((c) => ({ ...c, clientName: e.target.value }))} className={inputClass} /></Field>
            <Field label="Client Email"><input type="email" value={form.clientEmail} onChange={(e) => setForm((c) => ({ ...c, clientEmail: e.target.value }))} className={inputClass} /></Field>
            <Field label="Client Phone"><input value={form.clientPhone} onChange={(e) => setForm((c) => ({ ...c, clientPhone: e.target.value }))} className={inputClass} /></Field>
            <Field label="Opposing Party"><input value={form.opposingParty} onChange={(e) => setForm((c) => ({ ...c, opposingParty: e.target.value }))} className={inputClass} /></Field>
            <Field label="Assigned Advocate"><select value={form.advocateId} onChange={(e) => setForm((c) => ({ ...c, advocateId: e.target.value }))} className={inputClass}><option value="">Unassigned</option>{advocates.map((advocate) => <option key={advocate.id} value={advocate.id}>{advocate.name} {advocate.email ? `(${advocate.email})` : ''}</option>)}</select></Field>
            <Field label="Filing Date"><input type="date" value={form.filingDate} onChange={(e) => setForm((c) => ({ ...c, filingDate: e.target.value }))} className={inputClass} /></Field>
            <Field label="Next Hearing"><input type="date" value={form.nextHearingDate} onChange={(e) => setForm((c) => ({ ...c, nextHearingDate: e.target.value }))} className={inputClass} /></Field>
            <Field label="Court Appearance"><input type="date" value={form.courtAppearanceDate} onChange={(e) => setForm((c) => ({ ...c, courtAppearanceDate: e.target.value }))} className={inputClass} /></Field>
            <Field label="Email Control"><select value={form.emailControl} onChange={(e) => setForm((c) => ({ ...c, emailControl: e.target.value }))} className={inputClass}>{EMAIL_CONTROLS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
            <input type="checkbox" checked={form.sendReminder} onChange={(e) => setForm((c) => ({ ...c, sendReminder: e.target.checked }))} className="h-4 w-4 rounded border-slate-300" />
            Enable reminder email for the assigned file owner
          </label>
          <Field label="Description"><textarea value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} rows={5} className={`${inputClass} resize-none`} /></Field>
          <div className="flex gap-3">
            <Button type="button" onClick={save} className="h-11 flex-1 rounded-2xl bg-[#0a192f] px-5 font-black uppercase tracking-widest text-white hover:bg-[#c5a059] hover:text-[#0a192f]">{editorMode === 'create' ? <Plus className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}{editorMode === 'create' ? 'Create Case' : 'Save Changes'}</Button>
            <Button type="button" variant="outline" onClick={() => setEditorOpen(false)} className="h-11 flex-1 rounded-2xl border-slate-200 px-5 font-black uppercase tracking-widest text-slate-600">Cancel</Button>
          </div>
        </div>
      </AdminDialog>

      <AdminDialog isOpen={Boolean(preview)} onClose={() => setPreview(null)} title={preview?.caseNumber || 'Case Preview'} description="Preview and actions">
        {preview && (
          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap gap-2">
                <Tag>{preview.caseType}</Tag>
                <Tag>{preview.status}</Tag>
                {isUrgent(preview) && <Tag urgent>Urgent</Tag>}
              </div>
              <h3 className="mt-4 text-2xl font-black uppercase tracking-tight text-[#0a192f]">{preview.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{preview.clientName} - {preview.court}</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Info label="Advocate" value={preview.advocate?.name || 'Unassigned'} />
                <Info label="Client Email" value={preview.clientEmail} />
                <Info label="Next Hearing" value={fmtDate(preview.nextHearingDate)} />
                <Info label="Appearance Date" value={fmtDate(preview.courtAppearanceDate)} />
                <Info label="Documents" value={`${(preview.documents ?? []).length} files`} />
                <Info label="Payments" value={`INR ${(preview.payments ?? []).reduce((sum, payment) => sum + payment.amount, 0).toLocaleString('en-IN')}`} />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Button type="button" onClick={() => reminder(preview)} className="h-11 rounded-2xl bg-[#0a192f] px-5 font-black uppercase tracking-widest text-white hover:bg-[#c5a059] hover:text-[#0a192f]"><Send className="mr-2 h-4 w-4" />Send Reminder</Button>
              <Button type="button" variant="outline" onClick={() => openEdit(preview)} className="h-11 rounded-2xl border-slate-200 px-5 font-black uppercase tracking-widest text-slate-600"><Pencil className="mr-2 h-4 w-4" />Edit Case</Button>
              <Button type="button" variant="outline" onClick={() => remove(preview)} className="h-11 rounded-2xl border-red-200 px-5 font-black uppercase tracking-widest text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete Case</Button>
            </div>
            <div className="flex gap-3">
              <Link href={`/admin/cases/${preview.id}`} className="inline-flex h-11 items-center rounded-2xl bg-[#0a192f] px-5 text-[10px] font-black uppercase tracking-[0.24em] text-white hover:bg-[#c5a059] hover:text-[#0a192f]">Open Full File</Link>
              <Button type="button" variant="outline" onClick={() => setPreview(null)} className="h-11 rounded-2xl border-slate-200 px-5 font-black uppercase tracking-widest text-slate-600">Close</Button>
            </div>
          </div>
        )}
      </AdminDialog>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{label}</label>{children}</div>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3"><div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{label}</div><div className="mt-1 text-sm font-semibold text-slate-800">{value}</div></div>
}

function Tag({ children, urgent = false }: { children: React.ReactNode; urgent?: boolean }) {
  return <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${urgent ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600'}`}>{children}</span>
}
