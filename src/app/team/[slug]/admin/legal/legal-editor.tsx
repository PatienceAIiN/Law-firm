'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, FileText, Shield } from 'lucide-react'
import { RichEditor } from '@/components/admin/rich-editor'
import { saveLegalPage } from './actions'

export function LegalEditor({ slug, initialTerms, initialPrivacy }: { slug: string; initialTerms: string; initialPrivacy: string }) {
  const router = useRouter()
  const [tab, setTab] = useState<'terms' | 'privacy'>('terms')
  const [terms, setTerms] = useState(initialTerms)
  const [privacy, setPrivacy] = useState(initialPrivacy)
  const [busy, start] = useTransition()
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)

  const save = (which: 'terms' | 'privacy') => {
    setStatus(null)
    const html = which === 'terms' ? terms : privacy
    start(async () => {
      try {
        await saveLegalPage(slug, which, html)
        setStatus({ ok: true, message: `${which === 'terms' ? 'Terms' : 'Privacy'} updated.` })
        router.refresh()
      } catch (e: any) { setStatus({ ok: false, message: e?.message || 'Save failed' }) }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
        <button
          onClick={() => setTab('terms')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${tab === 'terms' ? 'bg-white text-primary shadow dark:bg-[#11151f] dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
        >
          <FileText className="h-4 w-4" /> Terms of Service
        </button>
        <button
          onClick={() => setTab('privacy')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${tab === 'privacy' ? 'bg-white text-primary shadow dark:bg-[#11151f] dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
        >
          <Shield className="h-4 w-4" /> Privacy Policy
        </button>
      </div>

      {tab === 'terms' ? (
        <RichEditor value={terms} onChange={setTerms} />
      ) : (
        <RichEditor value={privacy} onChange={setPrivacy} />
      )}

      {status && (
        <div className={`rounded-lg px-3 py-2 text-sm ${status.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{status.message}</div>
      )}

      <button
        disabled={busy}
        onClick={() => save(tab)}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save {tab === 'terms' ? 'Terms' : 'Privacy'}
      </button>
    </div>
  )
}
