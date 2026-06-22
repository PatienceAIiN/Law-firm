'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Scale, Edit3, Save, X, Trash2, Upload, FileText,
  IndianRupee, Plus, Send, Mail, Calendar, Loader2, CheckCircle,
  Camera, Download, AlertCircle
} from 'lucide-react'

interface Doc { id: string; name: string; fileUrl: string; fileType: string; fileSize: number | null; uploadedAt: string }
interface Payment { id: string; amount: number; mode: string; reference: string | null; description: string | null; paymentDate: string; createdAt: string }

interface CaseData {
  id: string
  caseNumber: string
  title: string
  caseType: string
  status: string
  court: string
  judge: string | null
  clientName: string
  clientEmail: string
  clientPhone: string | null
  opposingParty: string | null
  advocateId: string | null
  filingDate: string | null
  nextHearingDate: string | null
  courtAppearanceDate?: string | null
  description: string | null
  emailControl: string
  sendReminder: boolean
  reminderSentOn?: string | null
  photoUrl: string | null
  createdAt: string
  updatedAt: string
  documents: Doc[]
  payments: Payment[]
}

const CASE_TYPES = ['Civil', 'Criminal', 'Family', 'Property', 'Labour', 'Constitutional', 'Commercial', 'Revenue', 'Consumer', 'Motor Accident', 'Writ', 'Arbitration', 'Other']
const STATUSES = ['ACTIVE', 'PENDING', 'ADJOURNED', 'CLOSED', 'DISPOSED']
const EMAIL_CONTROLS = [
  { value: 'NONE', label: 'None' },
  { value: 'DETAILS_ONLY', label: 'Details Only' },
  { value: 'BILL_ONLY', label: 'Bill Only' },
  { value: 'BOTH', label: 'Both Details + Bill' },
]
const PAYMENT_MODES = ['CASH', 'CHEQUE', 'NEFT', 'UPI', 'CARD', 'DD']

function statusColor(s: string) {
  const m: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-gray-50 text-gray-600 border-gray-200',
    DISPOSED: 'bg-blue-50 text-blue-700 border-blue-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    ADJOURNED: 'bg-orange-50 text-orange-700 border-orange-200',
  }
  return m[s] || 'bg-gray-50 text-gray-600 border-gray-200'
}
function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
}
function fmtCur(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 })
}

export function CaseDetailClient({ caseData: initial }: { caseData: CaseData }) {
  const [caseData, setCaseData] = useState<CaseData>(initial)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ ...initial })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')

  // Documents
  const [docUploading, setDocUploading] = useState(false)
  const [docName, setDocName] = useState('')
  const docRef = useRef<HTMLInputElement>(null)

  // Photo
  const photoRef = useRef<HTMLInputElement>(null)
  const [photoUploading, setPhotoUploading] = useState(false)

  // Payments
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [payForm, setPayForm] = useState({ amount: '', mode: 'CASH', reference: '', description: '', paymentDate: '' })
  const [payLoading, setPayLoading] = useState(false)

  // Email
  const [emailLoading, setEmailLoading] = useState(false)
  const [sendType, setSendType] = useState(caseData.emailControl)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  // ── Save edits ──────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error('Save failed')
      const updated = await res.json()
      setCaseData(c => ({ ...c, ...updated }))
      setEditing(false)
      showToast('Case updated successfully')
    } catch {
      showToast('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete case ─────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirm(`Permanently delete case ${caseData.caseNumber}? This cannot be undone.`)) return
    setDeleting(true)
    await fetch(`/api/admin/cases/${caseData.id}`, { method: 'DELETE' })
    window.location.href = '/admin/cases'
  }

  // ── Upload document ─────────────────────────────────────
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDocUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', docName || file.name)
    try {
      const res = await fetch(`/api/admin/cases/${caseData.id}/documents`, { method: 'POST', body: fd })
      const doc = await res.json()
      if (!res.ok) throw new Error(doc.error)
      setCaseData(c => ({ ...c, documents: [doc, ...c.documents] }))
      setDocName('')
      showToast('Document uploaded')
    } catch (err: any) {
      showToast(err.message || 'Upload failed')
    } finally {
      setDocUploading(false)
      if (docRef.current) docRef.current.value = ''
    }
  }

  // ── Upload photo ────────────────────────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', 'case_photo')
    try {
      const res = await fetch(`/api/admin/cases/${caseData.id}/documents`, { method: 'POST', body: fd })
      const doc = await res.json()
      if (!res.ok) throw new Error(doc.error)
      // Save photoUrl
      const pRes = await fetch(`/api/admin/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: doc.fileUrl }),
      })
      const updated = await pRes.json()
      setCaseData(c => ({ ...c, photoUrl: updated.photoUrl, documents: [doc, ...c.documents] }))
      showToast('Photo uploaded')
    } catch (err: any) {
      showToast(err.message || 'Upload failed')
    } finally {
      setPhotoUploading(false)
    }
  }

  // ── Delete document ─────────────────────────────────────
  const handleDelDoc = async (docId: string) => {
    if (!confirm('Delete this document?')) return
    await fetch(`/api/admin/cases/${caseData.id}/documents?docId=${docId}`, { method: 'DELETE' })
    setCaseData(c => ({ ...c, documents: c.documents.filter(d => d.id !== docId) }))
    showToast('Document deleted')
  }

  // ── Add payment ─────────────────────────────────────────
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setPayLoading(true)
    try {
      const res = await fetch(`/api/admin/cases/${caseData.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payForm),
      })
      const payment = await res.json()
      if (!res.ok) throw new Error(payment.error)
      setCaseData(c => ({ ...c, payments: [payment, ...c.payments] }))
      setPayForm({ amount: '', mode: 'CASH', reference: '', description: '', paymentDate: '' })
      setShowPaymentForm(false)
      showToast('Payment recorded')
    } catch (err: any) {
      showToast(err.message || 'Failed to add payment')
    } finally {
      setPayLoading(false)
    }
  }

  // ── Delete payment ──────────────────────────────────────
  const handleDelPayment = async (paymentId: string) => {
    if (!confirm('Delete this payment record?')) return
    await fetch(`/api/admin/cases/${caseData.id}/payments?paymentId=${paymentId}`, { method: 'DELETE' })
    setCaseData(c => ({ ...c, payments: c.payments.filter(p => p.id !== paymentId) }))
    showToast('Payment deleted')
  }

  // ── Send email ──────────────────────────────────────────
  const handleSendEmail = async () => {
    if (sendType === 'NONE') { showToast('Email control is set to NONE — nothing to send'); return }
    if (!confirm(`Send email to ${caseData.clientEmail} with: ${sendType}?`)) return
    setEmailLoading(true)
    try {
      const res = await fetch(`/api/admin/cases/${caseData.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast(`Email sent to ${caseData.clientEmail}`)
    } catch (err: any) {
      showToast(err.message || 'Email failed')
    } finally {
      setEmailLoading(false)
    }
  }

  const totalPaid = caseData.payments.reduce((s, p) => s + p.amount, 0)
  const eField = (k: keyof typeof editForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setEditForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#14203E] text-white text-sm font-medium shadow-xl">
          <CheckCircle className="w-4 h-4 text-[#14203E]" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/cases" className="p-2 rounded-xl border border-[#F4E8D8] hover:bg-[#FFFCF8]">
            <ArrowLeft className="w-4 h-4 text-[#64748b]" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black font-mono text-[#64748b]">{caseData.caseNumber}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor(caseData.status)}`}>
                {caseData.status}
              </span>
            </div>
            <h1 className="text-xl font-black text-[#14203E]">{caseData.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="p-2 rounded-xl border border-[#F4E8D8] hover:bg-[#FFFCF8]">
                <X className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14203E] text-white text-sm font-bold hover:bg-[#1d2c52] disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setEditing(true); setEditForm({ ...caseData }) }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#F4E8D8] text-sm font-bold text-[#14203E] hover:bg-[#FFFCF8]">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-100 bg-red-50 text-red-500 text-sm font-bold hover:bg-red-100 disabled:opacity-60">
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Details */}
          <Card title="Case Details">
            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EField label="Case Number" value={editForm.caseNumber} onChange={eField('caseNumber')} />
                <EField label="Case Type">
                  <select value={editForm.caseType} onChange={eField('caseType')} className={inp}>
                    {CASE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </EField>
                <EField label="Title" className="sm:col-span-2" value={editForm.title} onChange={eField('title')} />
                <EField label="Court" value={editForm.court} onChange={eField('court')} />
                <EField label="Judge" value={editForm.judge || ''} onChange={eField('judge')} />
                <EField label="Status">
                  <select value={editForm.status} onChange={eField('status')} className={inp}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </EField>
                <EField label="Opposing Party" value={editForm.opposingParty || ''} onChange={eField('opposingParty')} />
                <EField label="Filing Date">
                  <input type="date" value={editForm.filingDate?.slice(0, 10) || ''} onChange={eField('filingDate')} className={inp} />
                </EField>
                <EField label="Next Hearing Date">
                  <input type="date" value={editForm.nextHearingDate?.slice(0, 10) || ''} onChange={eField('nextHearingDate')} className={inp} />
                </EField>
                <EField label="Court Appearance Date">
                  <input type="date" value={editForm.courtAppearanceDate?.slice(0, 10) || ''} onChange={eField('courtAppearanceDate')} className={inp} />
                </EField>
                <label className="flex items-center gap-3 rounded-xl border border-[#F4E8D8] bg-white px-4 py-3 text-sm font-semibold text-[#14203E]">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.sendReminder)}
                    onChange={(e) => setEditForm((f) => ({ ...f, sendReminder: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Enable appearance reminder
                </label>
                <EField label="Description / Notes" className="sm:col-span-2">
                  <textarea value={editForm.description || ''} onChange={eField('description')} rows={4} className={inp + ' resize-none'} />
                </EField>
              </div>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {[
                  ['Court', caseData.court],
                  ['Case Type', caseData.caseType],
                  ['Judge', caseData.judge],
                  ['Opposing Party', caseData.opposingParty],
                  ['Filing Date', fmtDate(caseData.filingDate)],
                  ['Next Hearing', fmtDate(caseData.nextHearingDate)],
                  ['Appearance Date', fmtDate(caseData.courtAppearanceDate || null)],
                ].map(([l, v]) => v && (
                  <div key={String(l)}>
                    <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">{l}</dt>
                    <dd className={`text-sm font-semibold mt-0.5 ${l === 'Next Hearing' ? 'text-[#14203E]' : 'text-[#14203E]'}`}>{v}</dd>
                  </div>
                ))}
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reminder</dt>
                  <dd className={`text-sm font-semibold mt-0.5 ${caseData.sendReminder ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {caseData.sendReminder ? 'Enabled' : 'Disabled'}
                  </dd>
                </div>
                {caseData.description && (
                  <div className="sm:col-span-2">
                    <dt className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Summary / Notes</dt>
                    <dd className="text-sm text-gray-600 whitespace-pre-wrap">{caseData.description}</dd>
                  </div>
                )}
              </dl>
            )}
          </Card>

          {/* Client Info */}
          <Card title="Client Information">
            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EField label="Client Name" value={editForm.clientName} onChange={eField('clientName')} />
                <EField label="Client Email">
                  <input type="email" value={editForm.clientEmail} onChange={eField('clientEmail')} className={inp} />
                </EField>
                <EField label="Client Phone" value={editForm.clientPhone || ''} onChange={eField('clientPhone')} />
              </div>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                <div><dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Name</dt><dd className="text-sm font-semibold text-[#14203E] mt-0.5">{caseData.clientName}</dd></div>
                <div><dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email</dt><dd className="text-sm font-semibold text-[#14203E] mt-0.5">{caseData.clientEmail}</dd></div>
                {caseData.clientPhone && <div><dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phone</dt><dd className="text-sm font-semibold text-[#14203E] mt-0.5">{caseData.clientPhone}</dd></div>}
              </dl>
            )}
          </Card>

          {/* Advocate */}
          <Card title="Advocate / File Owner">
            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EField label="Advocate ID" value={editForm.advocateId || ''} onChange={eField('advocateId')} />
              </div>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {caseData.advocateId && <div><dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Advocate ID</dt><dd className="text-sm font-semibold text-[#14203E] mt-0.5">{caseData.advocateId}</dd></div>}
                {!caseData.advocateId && <div><dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</dt><dd className="text-sm font-semibold text-amber-700 mt-0.5">Not assigned</dd></div>}
              </dl>
            )}
          </Card>

          {/* Documents */}
          <Card title={`Documents (${caseData.documents.length})`}>
            <div className="flex gap-3 mb-4">
              <input
                value={docName}
                onChange={e => setDocName(e.target.value)}
                placeholder="Document name (optional)"
                className={inp + ' flex-1'}
              />
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#F4E8D8] text-sm font-bold text-[#14203E] hover:bg-[#FFFCF8] cursor-pointer">
                {docUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload
                <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={handleDocUpload} />
              </label>
            </div>
            <div className="space-y-2">
              {caseData.documents.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No documents uploaded yet.</p>
              )}
              {caseData.documents.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#F6F0E8] bg-[#FFFCF8]">
                  <FileText className="w-4 h-4 text-[#64748b] flex-shrink-0" />
                  <span className="flex-1 text-sm text-[#14203E] truncate">{doc.name}</span>
                  <span className="text-[10px] text-gray-400">{doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : ''}</span>
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-[#F4E8D8] transition-colors">
                    <Download className="w-3.5 h-3.5 text-[#64748b]" />
                  </a>
                  <button onClick={() => handleDelDoc(doc.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Payments */}
          <Card title={`Payments — ${fmtCur(totalPaid)} total paid`}>
            <div className="mb-4">
              {!showPaymentForm ? (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#F4E8D8] text-sm font-bold text-[#14203E] hover:bg-[#FFFCF8]"
                >
                  <Plus className="w-4 h-4" /> Add Payment
                </button>
              ) : (
                <form onSubmit={handleAddPayment} className="space-y-3 rounded-xl border border-[#F4E8D8] bg-[#FFFCF8] p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Amount (₹) *</label>
                      <input type="number" step="0.01" min="0" required value={payForm.amount}
                        onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} className={inp} placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Mode *</label>
                      <select required value={payForm.mode} onChange={e => setPayForm(f => ({ ...f, mode: e.target.value }))} className={inp}>
                        {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Date *</label>
                      <input type="date" required value={payForm.paymentDate}
                        onChange={e => setPayForm(f => ({ ...f, paymentDate: e.target.value }))} className={inp} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Reference No.</label>
                      <input value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                        placeholder="Cheque / Txn no." className={inp} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Description</label>
                    <input value={payForm.description} onChange={e => setPayForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Retainer fee, court fee, etc." className={inp} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="submit" disabled={payLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14203E] text-white text-sm font-bold hover:bg-[#1d2c52] disabled:opacity-60">
                      {payLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <IndianRupee className="w-3.5 h-3.5" />}
                      Record Payment
                    </button>
                    <button type="button" onClick={() => setShowPaymentForm(false)}
                      className="px-4 py-2 rounded-xl border border-[#F4E8D8] text-sm font-bold text-gray-500 hover:bg-[#FFFCF8]">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
            <div className="space-y-2">
              {caseData.payments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No payments recorded yet.</p>
              )}
              {caseData.payments.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#F6F0E8] bg-[#FFFCF8]">
                  <IndianRupee className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#14203E]">{fmtCur(p.amount)}</span>
                      <span className="text-[10px] font-bold border rounded-full px-2 py-0.5 border-emerald-200 bg-emerald-50 text-emerald-700">{p.mode}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {fmtDate(p.paymentDate)}{p.reference ? ` · Ref: ${p.reference}` : ''}{p.description ? ` · ${p.description}` : ''}
                    </p>
                  </div>
                  <button onClick={() => handleDelPayment(p.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Case Photo */}
          <div className="rounded-2xl border border-[#F4E8D8] bg-white overflow-hidden">
            {caseData.photoUrl ? (
              <img src={caseData.photoUrl} alt="Case" className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-[#FFFCF8] flex items-center justify-center">
                <Scale className="w-12 h-12 text-gray-200" />
              </div>
            )}
            <div className="p-3">
              <label className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-[#F4E8D8] text-xs font-bold text-[#64748b] hover:bg-[#FFFCF8] cursor-pointer">
                {photoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                {caseData.photoUrl ? 'Change Photo' : 'Upload Photo'}
                <input type="file" accept="image/*" className="hidden" ref={photoRef} onChange={handlePhotoUpload} />
              </label>
            </div>
          </div>

          {/* Quick Stats */}
          <Card title="Case Summary">
            <dl className="space-y-3">
              <div><dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Client</dt><dd className="text-sm font-bold text-[#14203E] mt-0.5">{caseData.clientName}</dd></div>
              <div><dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Paid</dt><dd className="text-lg font-black text-emerald-600 mt-0.5">{fmtCur(totalPaid)}</dd></div>
              <div><dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Documents</dt><dd className="text-sm font-bold text-[#14203E] mt-0.5">{caseData.documents.length} files</dd></div>
              <div><dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Next Hearing</dt>
                <dd className={`text-sm font-bold mt-0.5 ${caseData.nextHearingDate ? 'text-[#14203E]' : 'text-gray-400'}`}>
                  {fmtDate(caseData.nextHearingDate)}
                </dd>
              </div>
              <div><dt className="text-[10px] font-black uppercase tracking-widest text-gray-400">Registered On</dt><dd className="text-sm font-bold text-gray-500 mt-0.5">{fmtDate(caseData.createdAt)}</dd></div>
            </dl>
          </Card>

          {/* Send Email */}
          <Card title="Send Email to Client">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">What to Send</label>
                <select value={sendType} onChange={e => setSendType(e.target.value)} className={inp}>
                  {EMAIL_CONTROLS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              {editing && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Default Email Control (saved)</label>
                  <select value={editForm.emailControl} onChange={eField('emailControl')} className={inp}>
                    {EMAIL_CONTROLS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </div>
              )}
              <button
                onClick={handleSendEmail}
                disabled={emailLoading || sendType === 'NONE'}
                className="flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl bg-[#14203E] text-white text-sm font-bold hover:bg-[#1d2c52] disabled:opacity-50 transition-colors"
              >
                {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {emailLoading ? 'Sending…' : 'Send to ' + caseData.clientEmail}
              </button>
              {sendType === 'NONE' && (
                <p className="text-xs text-gray-400 text-center">Select a send type above to enable email.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

const inp = 'w-full px-3 py-2.5 rounded-xl bg-white border border-[#F4E8D8] text-sm text-[#14203E] outline-none focus:ring-2 focus:ring-[#14203E]/10'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#F4E8D8] bg-white p-5">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-4">{title}</h2>
      {children}
    </div>
  )
}

function EField({ label, value, onChange, className, children }: {
  label: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</label>
      {children ?? <input value={value ?? ''} onChange={onChange} className={inp} />}
    </div>
  )
}
