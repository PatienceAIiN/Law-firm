'use client'

import { useTransition } from 'react'
import { assignInquiry } from './actions'
import { Loader2 } from 'lucide-react'

type Advocate = { id: string; name: string }
type Inquiry = { id: string; fullName: string; email: string; subject: string; message: string; createdAt: Date; advocateId: string | null }

export function TenantInquiriesClient({ slug, items, advocates }: { slug: string; items: Inquiry[]; advocates: Advocate[] }) {
  const [pending, start] = useTransition()

  const handleAssign = (inquiryId: string, advocateId: string) => {
    start(async () => {
      try {
        await assignInquiry(slug, inquiryId, advocateId || null)
      } catch (err: any) {
        alert(err.message || 'Failed to assign')
      }
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#11151f]">
      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">No inquiries from your site yet.</p>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-white/10">
          {items.map((i) => (
            <li key={i.id} className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--primary)] dark:text-white">
                    {i.fullName} <span className="ml-2 text-xs font-normal text-slate-500">{i.email}</span>
                  </p>
                  <span className="text-xs text-slate-400">{new Date(i.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Assign to:</span>
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
                  {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                </div>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">{i.subject}</p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{i.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
