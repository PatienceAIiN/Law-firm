'use client'

import { useState } from 'react'
import { Plus, X, Loader2, Check } from 'lucide-react'
import type { HomeContent } from '@/lib/home-content'

const field = 'w-full rounded-xl border border-[#F4E8D8] bg-white px-3 py-2.5 text-sm text-[#14203E] outline-none focus:border-[#14203E]'
const label = 'mb-1 block text-xs font-semibold text-[#14203E]/60'

export function HomeContentForm({ initial }: { initial: HomeContent }) {
  const [form, setForm] = useState<HomeContent>(initial)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const set = (k: keyof HomeContent, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setBusy(true); setMsg('')
    try {
      const r = await fetch('/api/admin/home-content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!r.ok) throw new Error((await r.json()).error || 'Save failed')
      setMsg('Saved — the home page is updated.')
    } catch (e: any) { setMsg(e?.message || 'Could not save') }
    finally { setBusy(false); setTimeout(() => setMsg(''), 3000) }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="rounded-2xl border border-[#F4E8D8] bg-white p-5 space-y-3">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#14203E]/60">Hero</h2>
        <div><label className={label}>Headline</label><input className={field} value={form.title} onChange={(e) => set('title', e.target.value)} /></div>
        <div><label className={label}>Subtitle</label><textarea rows={2} className={field} value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Button Label</label><input className={field} value={form.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} /></div>
          <div><label className={label}>Button Link</label><input className={field} value={form.ctaHref} onChange={(e) => set('ctaHref', e.target.value)} /></div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#F4E8D8] bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-[#14203E]/60">Feature Cards</h2>
          <button onClick={() => set('features', [...form.features, { title: '', desc: '' }])} className="inline-flex items-center gap-1 text-xs font-semibold text-[#14203E]"><Plus className="h-3.5 w-3.5" /> Add</button>
        </div>
        {form.features.map((f, i) => (
          <div key={i} className="flex items-start gap-2 rounded-xl border border-[#F4E8D8] bg-[#FFFCF8] p-3">
            <div className="flex-1 space-y-2">
              <input className={field} placeholder="Card title" value={f.title} onChange={(e) => set('features', form.features.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} />
              <input className={field} placeholder="Card description" value={f.desc} onChange={(e) => set('features', form.features.map((x, idx) => idx === i ? { ...x, desc: e.target.value } : x))} />
            </div>
            <button onClick={() => set('features', form.features.filter((_, idx) => idx !== i))} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#14203E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1d2c52] disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save Changes
        </button>
        {msg && <span className="text-sm text-emerald-600">{msg}</span>}
      </div>
    </div>
  )
}
