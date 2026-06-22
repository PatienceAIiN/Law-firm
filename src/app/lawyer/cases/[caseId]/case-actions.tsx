'use client'

import { useState } from 'react'
import { useRef } from 'react'
import { Pencil, X, Loader2, Check, Plus, Trash2, Upload, FileText, Download, Bell, Send } from 'lucide-react'

type CaseData = {
  id: string; title: string; caseType: string; court: string; judge: string | null
  clientName: string; clientEmail: string; clientPhone: string | null; opposingParty: string | null
  filingDate: string | null; nextHearingDate: string | null; description: string | null
}

const field = 'w-full rounded-xl border border-[#F4E8D8] bg-white px-3 py-2.5 text-sm text-[#14203E] outline-none focus:border-[#14203E]'
const label = 'mb-1 block text-xs font-semibold text-[#14203E]/60'

function dateInput(v: string | null) {
  return v ? new Date(v).toISOString().slice(0, 10) : ''
}

export function EditCaseButton({ data }: { data: CaseData }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: data.title, caseType: data.caseType || '', court: data.court || '', judge: data.judge || '',
    clientName: data.clientName, clientEmail: data.clientEmail, clientPhone: data.clientPhone || '',
    opposingParty: data.opposingParty || '', filingDate: dateInput(data.filingDate),
    nextHearingDate: dateInput(data.nextHearingDate), description: data.description || '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    setBusy(true); setError('')
    try {
      const r = await fetch(`/api/lawyer/cases/${data.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Update failed')
      location.reload()
    } catch (e: any) { setError(e?.message || 'Could not save'); setBusy(false) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#14203E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d2c52]">
        <Pencil className="h-4 w-4" /> Edit Case
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8" onClick={() => !busy && setOpen(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-[#F4E8D8]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#F4E8D8] px-5 py-4">
              <h3 className="text-lg font-bold text-[#14203E]">Edit Case</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-[#14203E]/60 hover:bg-[#F6F0E8]"><X className="h-5 w-5" /></button>
            </div>
            <div className="max-h-[72vh] space-y-3 overflow-y-auto p-5">
              <div><label className={label}>Case Title</label><input className={field} value={form.title} onChange={(e) => set('title', e.target.value)} /></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><label className={label}>Case Type</label><input className={field} value={form.caseType} onChange={(e) => set('caseType', e.target.value)} /></div>
                <div><label className={label}>Court</label><input className={field} value={form.court} onChange={(e) => set('court', e.target.value)} /></div>
                <div><label className={label}>Judge</label><input className={field} value={form.judge} onChange={(e) => set('judge', e.target.value)} /></div>
                <div><label className={label}>Opposing Party</label><input className={field} value={form.opposingParty} onChange={(e) => set('opposingParty', e.target.value)} /></div>
                <div><label className={label}>Filing Date</label><input type="date" className={field} value={form.filingDate} onChange={(e) => set('filingDate', e.target.value)} /></div>
                <div><label className={label}>Next Hearing Date</label><input type="date" className={field} value={form.nextHearingDate} onChange={(e) => set('nextHearingDate', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div><label className={label}>Client Name</label><input className={field} value={form.clientName} onChange={(e) => set('clientName', e.target.value)} /></div>
                <div><label className={label}>Client Email</label><input className={field} value={form.clientEmail} onChange={(e) => set('clientEmail', e.target.value)} /></div>
                <div><label className={label}>Client Phone</label><input className={field} value={form.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} /></div>
              </div>
              <div><label className={label}>Case Summary</label><textarea rows={4} className={field} value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#F4E8D8] px-5 py-4">
              {error && <span className="text-sm text-red-500">{error}</span>}
              <button onClick={() => setOpen(false)} className="rounded-xl border border-[#F4E8D8] px-4 py-2 text-sm font-semibold text-[#14203E]">Cancel</button>
              <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#14203E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1d2c52] disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function AddNoteForm({ caseId }: { caseId: string }) {
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const add = async () => {
    if (!content.trim()) return
    setBusy(true); setError('')
    try {
      const r = await fetch(`/api/lawyer/cases/${caseId}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, isPrivate }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed to add note')
      location.reload()
    } catch (e: any) { setError(e?.message || 'Could not add note'); setBusy(false) }
  }

  return (
    <div className="mb-5 rounded-xl border border-[#F4E8D8] bg-[#FFFCF8] p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a case note…"
        rows={3}
        className="w-full resize-y rounded-lg border border-[#F4E8D8] bg-white px-3 py-2 text-sm text-[#14203E] outline-none focus:border-[#14203E]"
      />
      <div className="mt-2 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-[#14203E]/70">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} /> Private note
        </label>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-500">{error}</span>}
          <button onClick={add} disabled={busy || !content.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#14203E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d2c52] disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Note
          </button>
        </div>
      </div>
    </div>
  )
}

export function DeleteCaseButton({ caseId }: { caseId: string }) {
  const [busy, setBusy] = useState(false)
  const del = async () => {
    if (!confirm('Delete this case permanently? This also removes it from the admin panel.')) return
    setBusy(true)
    const r = await fetch(`/api/lawyer/cases/${caseId}`, { method: 'DELETE' })
    if (r.ok) window.location.href = '/lawyer/dashboard'
    else { setBusy(false); alert('Could not delete case') }
  }
  return (
    <button onClick={del} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete Case
    </button>
  )
}

export function NewCaseButton() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    caseNumber: '', title: '', caseType: 'Civil', court: '', judge: '',
    clientName: '', clientEmail: '', clientPhone: '', opposingParty: '',
    filingDate: '', nextHearingDate: '', status: 'ACTIVE', description: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const create = async () => {
    setBusy(true); setError('')
    try {
      const r = await fetch('/api/lawyer/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Could not create case')
      window.location.href = `/lawyer/cases/${d.id}`
    } catch (e: any) { setError(e?.message || 'Could not create case'); setBusy(false) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-[#14203E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d2c52]">
        <Plus className="h-4 w-4" /> New Case
      </button>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8" onClick={() => !busy && setOpen(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-[#F4E8D8]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#F4E8D8] px-5 py-4">
              <h3 className="text-lg font-bold text-[#14203E]">Add New Case</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-[#14203E]/60 hover:bg-[#F6F0E8]"><X className="h-5 w-5" /></button>
            </div>
            <div className="max-h-[72vh] space-y-3 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><label className={label}>Case Number *</label><input className={field} value={form.caseNumber} onChange={(e) => set('caseNumber', e.target.value)} placeholder="e.g. CRL-2026-0042" /></div>
                <div><label className={label}>Case Type *</label><input className={field} value={form.caseType} onChange={(e) => set('caseType', e.target.value)} /></div>
              </div>
              <div><label className={label}>Case Title *</label><input className={field} value={form.title} onChange={(e) => set('title', e.target.value)} /></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><label className={label}>Court *</label><input className={field} value={form.court} onChange={(e) => set('court', e.target.value)} /></div>
                <div><label className={label}>Judge</label><input className={field} value={form.judge} onChange={(e) => set('judge', e.target.value)} /></div>
                <div><label className={label}>Client Name *</label><input className={field} value={form.clientName} onChange={(e) => set('clientName', e.target.value)} /></div>
                <div><label className={label}>Client Email *</label><input className={field} value={form.clientEmail} onChange={(e) => set('clientEmail', e.target.value)} /></div>
                <div><label className={label}>Client Phone</label><input className={field} value={form.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} /></div>
                <div><label className={label}>Opposing Party</label><input className={field} value={form.opposingParty} onChange={(e) => set('opposingParty', e.target.value)} /></div>
                <div><label className={label}>Filing Date</label><input type="date" className={field} value={form.filingDate} onChange={(e) => set('filingDate', e.target.value)} /></div>
                <div><label className={label}>Next Hearing</label><input type="date" className={field} value={form.nextHearingDate} onChange={(e) => set('nextHearingDate', e.target.value)} /></div>
              </div>
              <div><label className={label}>Case Summary</label><textarea rows={3} className={field} value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#F4E8D8] px-5 py-4">
              {error && <span className="text-sm text-red-500">{error}</span>}
              <button onClick={() => setOpen(false)} className="rounded-xl border border-[#F4E8D8] px-4 py-2 text-sm font-semibold text-[#14203E]">Cancel</button>
              <button onClick={create} disabled={busy || !form.caseNumber.trim() || !form.title.trim()} className="inline-flex items-center gap-2 rounded-xl bg-[#14203E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1d2c52] disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Create Case
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function DeleteNoteButton({ caseId, noteId }: { caseId: string; noteId: string }) {
  const [busy, setBusy] = useState(false)
  const del = async () => {
    if (!confirm('Delete this note?')) return
    setBusy(true)
    await fetch(`/api/lawyer/cases/${caseId}/notes?noteId=${noteId}`, { method: 'DELETE' })
    location.reload()
  }
  return (
    <button onClick={del} disabled={busy} title="Delete note" className="text-red-500 hover:text-red-700">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  )
}

type Doc = { id: string; name: string; fileUrl: string; fileType: string; fileSize: number | null; uploadedAt: string }

function fmtSize(b: number | null) {
  if (!b) return ''
  return b > 1024 * 1024 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`
}

export function DocumentManager({ caseId, initial }: { caseId: string; initial: Doc[] }) {
  const [docs, setDocs] = useState<Doc[]>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    setBusy(true); setError('')
    try {
      const fd = new FormData(); fd.set('file', file)
      const r = await fetch(`/api/lawyer/cases/${caseId}/documents`, { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Upload failed')
      setDocs((p) => [d.document, ...p])
    } catch (e: any) { setError(e?.message || 'Upload failed') }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = '' }
  }

  const del = async (id: string) => {
    if (!confirm('Delete this document?')) return
    await fetch(`/api/lawyer/cases/${caseId}/documents?docId=${id}`, { method: 'DELETE' })
    setDocs((p) => p.filter((x) => x.id !== id))
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f) }}
          className="hidden"
        />
        <button onClick={() => inputRef.current?.click()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#14203E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d2c52] disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload Document
        </button>
        <span className="text-xs text-gray-400">PDF, DOC, DOCX, XLS, XLSX · up to 20 MB</span>
      </div>
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
      {docs.length === 0 ? (
        <p className="text-sm text-gray-500">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-[#14203E]" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900">{d.name}</div>
                  <div className="text-xs text-gray-500">{new Date(d.uploadedAt).toLocaleDateString('en-IN')} · {fmtSize(d.fileSize)}</div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a href={d.fileUrl.startsWith('http') ? d.fileUrl : `/uploads/cases/${d.fileUrl}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-[#14203E] hover:bg-gray-100"><Download className="h-4 w-4" /></a>
                <button onClick={() => del(d.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SetReminderButton({ caseId, nextHearingDate }: { caseId: string; nextHearingDate: string | null }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nextHearingDate: nextHearingDate ? new Date(nextHearingDate).toISOString().slice(0, 10) : '',
    message: '',
    includeDetails: true,
    scheduledFor: '',
  })
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (sendNow: boolean) => {
    setBusy(true); setError(''); setMsg('')
    try {
      const r = await fetch(`/api/lawyer/cases/${caseId}/reminder`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sendNow }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed')
      setMsg(sendNow ? `Reminder emailed to ${d.recipients?.length || 0} recipient(s)${d.delivered ? '' : ' (dev: logged)'}` : `Reminder scheduled for ${new Date(d.scheduledFor).toLocaleString('en-IN')}`)
      setTimeout(() => { setOpen(false); location.reload() }, 1300)
    } catch (e: any) { setError(e?.message || 'Could not set reminder') }
    finally { setBusy(false) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-[#F4E8D8] bg-[#F6F0E8] px-4 py-2 text-sm font-semibold text-[#14203E] hover:bg-[#efe6d8]">
        <Bell className="h-4 w-4" /> Set Reminder
      </button>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8" onClick={() => !busy && setOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-[#F4E8D8]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#F4E8D8] px-5 py-4">
              <h3 className="text-lg font-bold text-[#14203E]">Set Reminder</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-[#14203E]/60 hover:bg-[#F6F0E8]"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 p-5">
              <div><label className={label}>Next Hearing Date</label><input type="date" className={field} value={form.nextHearingDate} onChange={(e) => set('nextHearingDate', e.target.value)} /></div>
              <div><label className={label}>Message to client (optional)</label><textarea rows={3} className={field} value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="e.g. Please bring original documents." /></div>
              <label className="flex items-center gap-2 text-sm text-[#14203E]/70">
                <input type="checkbox" checked={form.includeDetails} onChange={(e) => set('includeDetails', e.target.checked)} /> Include case details & document links
              </label>
              <div><label className={label}>Auto-send at (date &amp; time)</label><input type="datetime-local" className={field} value={form.scheduledFor} onChange={(e) => set('scheduledFor', e.target.value)} /></div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              {msg && <p className="text-sm text-emerald-600">{msg}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#F4E8D8] px-5 py-4">
              <button onClick={() => submit(true)} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-[#14203E] px-4 py-2 text-sm font-semibold text-[#14203E] disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Now
              </button>
              <button onClick={() => submit(false)} disabled={busy || !form.scheduledFor} className="inline-flex items-center gap-2 rounded-xl bg-[#14203E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1d2c52] disabled:opacity-60">
                <Bell className="h-4 w-4" /> Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
