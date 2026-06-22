'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Scale, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const CASE_TYPES = ['Civil', 'Criminal', 'Family', 'Property', 'Labour', 'Constitutional', 'Commercial', 'Revenue', 'Consumer', 'Motor Accident', 'Writ', 'Arbitration', 'Other']
const STATUSES = ['ACTIVE', 'PENDING', 'ADJOURNED', 'CLOSED', 'DISPOSED']
const EMAIL_CONTROLS = [
  { value: 'NONE', label: 'None — no email to client' },
  { value: 'DETAILS_ONLY', label: 'Case Details Only' },
  { value: 'BILL_ONLY', label: 'Payment Bill Only' },
  { value: 'BOTH', label: 'Both Details + Bill' },
]

export default function NewCasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
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
    advocate: '',
    advocateEmail: '',
    filingDate: '',
    nextHearingDate: '',
    courtAppearanceDate: '',
    description: '',
    emailControl: 'NONE',
    sendReminder: true,
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create case')
      router.push(`/admin/cases/${data.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create case')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/cases" className="p-2 rounded-xl border border-[#F4E8D8] hover:bg-[#FFFCF8] transition-colors">
          <ArrowLeft className="w-4 h-4 text-[#64748b]" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#14203E]">Add New Case</h1>
          <p className="text-sm text-gray-500">Fill in all case details to create a new court case record.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Case Info */}
        <Section title="Case Information">
          <Grid2>
            <Field label="Case Number *" required>
              <input name="caseNumber" required value={form.caseNumber} onChange={set('caseNumber')} placeholder="e.g. CS/1234/2024" className={input} />
            </Field>
            <Field label="Case Type *" required>
              <select name="caseType" required value={form.caseType} onChange={set('caseType')} className={input}>
                {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Title / Matter *" required className="sm:col-span-2">
              <input name="title" required value={form.title} onChange={set('title')} placeholder="e.g. Kumar vs. State of Tamil Nadu" className={input} />
            </Field>
            <Field label="Court *" required>
              <input name="court" required value={form.court} onChange={set('court')} placeholder="e.g. High Court of Madras" className={input} />
            </Field>
            <Field label="Judge / Bench">
              <input name="judge" value={form.judge} onChange={set('judge')} placeholder="Honourable Justice..." className={input} />
            </Field>
            <Field label="Status *" required>
              <select name="status" required value={form.status} onChange={set('status')} className={input}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Opposing Party">
              <input name="opposingParty" value={form.opposingParty} onChange={set('opposingParty')} placeholder="Name of opposite party" className={input} />
            </Field>
            <Field label="Filing Date">
              <input type="date" name="filingDate" value={form.filingDate} onChange={set('filingDate')} className={input} />
            </Field>
            <Field label="Next Hearing Date">
              <input type="date" name="nextHearingDate" value={form.nextHearingDate} onChange={set('nextHearingDate')} className={input} />
            </Field>
            <Field label="Court Appearance Date">
              <input type="date" name="courtAppearanceDate" value={form.courtAppearanceDate} onChange={set('courtAppearanceDate')} className={input} />
            </Field>
          </Grid2>
          <Field label="Case Summary / Notes" className="mt-4">
            <textarea name="description" value={form.description} onChange={set('description')} rows={4}
              placeholder="Brief summary of the case, background, arguments, orders passed..."
              className={input + ' resize-none'} />
          </Field>
        </Section>

        {/* Client Info */}
        <Section title="Client Information">
          <Grid2>
            <Field label="Client Name *" required>
              <input name="clientName" required value={form.clientName} onChange={set('clientName')} placeholder="Full name" className={input} />
            </Field>
            <Field label="Client Email *" required>
              <input type="email" name="clientEmail" required value={form.clientEmail} onChange={set('clientEmail')} placeholder="client@email.com" className={input} />
            </Field>
            <Field label="Client Phone">
              <input type="tel" name="clientPhone" value={form.clientPhone} onChange={set('clientPhone')} placeholder="+91 98765 43210" className={input} />
            </Field>
          </Grid2>
        </Section>

        {/* Advocate Info */}
        <Section title="Advocate / File Owner">
          <Grid2>
            <Field label="Assigned Advocate">
              <input name="advocate" value={form.advocate} onChange={set('advocate')} placeholder="Advocate full name" className={input} />
            </Field>
            <Field label="Advocate Email">
              <input type="email" name="advocateEmail" value={form.advocateEmail} onChange={set('advocateEmail')} placeholder="advocate@chambers.com" className={input} />
            </Field>
          </Grid2>
        </Section>

        {/* Email Controls */}
        <Section title="Client Email Settings">
          <Field label="What to send to client when email is triggered">
            <select name="emailControl" value={form.emailControl} onChange={set('emailControl')} className={input}>
              {EMAIL_CONTROLS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </Field>
          <label className="flex items-center gap-3 rounded-2xl border border-[#F4E8D8] bg-white px-4 py-3 text-sm font-semibold text-[#14203E]">
            <input
              type="checkbox"
              name="sendReminder"
              checked={form.sendReminder}
              onChange={(e) => setForm((f) => ({ ...f, sendReminder: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            Enable appearance reminder for assigned advocate
          </label>
          <p className="text-xs text-gray-400 mt-2">This controls what PDF attachments are sent when you trigger an email from the case detail page.</p>
        </Section>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#14203E] text-white text-sm font-bold hover:bg-[#1d2c52] transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
            {loading ? 'Creating Case…' : 'Create Case'}
          </button>
          <Link href="/admin/cases" className="px-6 py-3 rounded-xl border border-[#F4E8D8] text-sm font-bold text-[#64748b] hover:bg-[#FFFCF8] transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

const input = 'w-full px-3 py-2.5 rounded-xl bg-white border border-[#F4E8D8] text-sm text-[#14203E] outline-none focus:ring-2 focus:ring-[#14203E]/10'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#F4E8D8] bg-[#FFFCF8] p-5 space-y-4">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-[#64748b]">{title}</h2>
      {children}
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
}

function Field({ label, children, required, className }: { label: string; children: React.ReactNode; required?: boolean; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  )
}
