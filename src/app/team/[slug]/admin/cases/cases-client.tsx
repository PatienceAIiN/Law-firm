'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Download, FileUp, Plus, Trash2, FileText, Loader2 } from 'lucide-react'
import { createCase, deleteCase, importCases } from './actions'
import { DeleteButton } from '@/components/ui/delete-button'

type C = { id: string; caseNumber: string; title: string; status: string; court: string; clientName: string; advocateName: string | null; nextHearingDate: string | null }
type A = { id: string; name: string; email: string }

export function TenantCasesClient({ slug, cases, advocates }: { slug: string; cases: C[]; advocates: A[] }) {
  const [pending, start] = useTransition()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setError('')
    const fd = new FormData(); fd.set('file', file)
    start(async () => {
      try {
        const result = await importCases(slug, fd)
        window.alert(`Imported ${result.created} case(s). Skipped ${result.skipped} duplicate/invalid row(s).`)
        router.refresh()
      } catch (err: any) { setError(err.message || 'Import failed') }
      finally { setImporting(false); e.target.value = '' }
    })
  }

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    start(async () => {
      try {
        await createCase(slug, fd)
        setOpen(false)
        router.refresh()
      } catch (err: any) { setError(err.message || 'Failed') }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{cases.length} case{cases.length === 1 ? '' : 's'}</p>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-[#11151f] dark:text-slate-200">
            {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />} Import CSV/XLSX
            <input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={onImport} className="hidden" />
          </label>
          <a href={`/team/${slug}/admin/api/cases/export?format=pdf`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-[#11151f] dark:text-slate-200"><Download className="h-3.5 w-3.5" /> PDF</a>
          <a href={`/team/${slug}/admin/api/cases/export?format=xlsx`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-[#11151f] dark:text-slate-200"><Download className="h-3.5 w-3.5" /> XLSX</a>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent"
          >
            <Plus className="h-3.5 w-3.5" /> New case
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
        {cases.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No cases yet. Create your first case to assign to a lawyer.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/5">
              <tr>
                <th className="px-3 py-2 text-left">Case #</th>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Client</th>
                <th className="px-3 py-2 text-left">Court</th>
                <th className="px-3 py-2 text-left">Lawyer</th>
                <th className="px-3 py-2 text-left">Next hearing</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {cases.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2 font-mono text-xs">{c.caseNumber}</td>
                  <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{c.title}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{c.clientName}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{c.court}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{c.advocateName || '—'}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{c.nextHearingDate ? new Date(c.nextHearingDate).toLocaleDateString() : '—'}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-700 dark:bg-white/10 dark:text-slate-200">{c.status}</span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <DeleteButton
                      onDelete={() => deleteCase(slug, c.id)}
                      confirmMessage={`Delete case "${c.title}"?`}
                      className="rounded-md p-1 text-rose-500 hover:bg-rose-50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#11151f]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-primary dark:text-white" /><h3 className="text-lg font-bold text-slate-900 dark:text-white">New case</h3></div>
            <form onSubmit={onCreate} className="grid grid-cols-2 gap-3 text-sm">
              <input name="caseNumber" required placeholder="Case #" className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              <input name="title" required placeholder="Title" className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              <select name="caseType" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white">
                {['Civil', 'Criminal', 'Family', 'Property', 'Labour', 'Corporate'].map((x) => <option key={x}>{x}</option>)}
              </select>
              <select name="status" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white">
                {['ACTIVE', 'PENDING', 'ADJOURNED', 'CLOSED', 'DISPOSED'].map((x) => <option key={x}>{x}</option>)}
              </select>
              <input name="court" required placeholder="Court" className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              <input name="clientName" required placeholder="Client name" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              <input name="clientEmail" type="email" placeholder="Client email" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              <input name="clientPhone" placeholder="Client phone" className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              <select name="advocateId" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white">
                <option value="">— assign lawyer (optional) —</option>
                {advocates.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.email})</option>)}
              </select>
              <input name="nextHearingDate" type="date" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/15 dark:bg-white/5 dark:text-white" />
              {error && <div className="col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}
              <div className="col-span-2 flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">Cancel</button>
                <button disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-accent disabled:opacity-60">
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
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
