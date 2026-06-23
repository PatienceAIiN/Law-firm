'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, ExternalLink, Send, Loader2, CheckCircle2 } from 'lucide-react'
import { sharePackages } from './actions'

type Feature = { key: string; icon: string; label: string; href: string; url: string; body: string; audience: string[] }
type Person = { id: string; kind: 'admin' | 'lawyer'; name: string; email: string }

export function PackagesClient({ slug, features, people }: { slug: string; features: Feature[]; people: Person[] }) {
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set())
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set())
  const [audience, setAudience] = useState<'all' | 'public' | 'admin' | 'lawyer'>('all')
  const [copied, setCopied] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [sent, setSent] = useState<{ ok: boolean; message: string } | null>(null)
  const router = useRouter()

  const filtered = useMemo(
    () => (audience === 'all' ? features : features.filter((f) => f.audience.includes(audience))),
    [features, audience],
  )

  const toggleFeature = (key: string) => {
    setSelectedFeatures((s) => {
      const next = new Set(s)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }
  const togglePerson = (id: string) => {
    setSelectedPeople((s) => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const copy = async (label: string, url: string) => {
    try { await navigator.clipboard.writeText(url); setCopied(label); setTimeout(() => setCopied(null), 1600) } catch {}
  }

  const send = () => {
    setSent(null)
    if (selectedFeatures.size === 0) { setSent({ ok: false, message: 'Pick at least one page to share.' }); return }
    if (selectedPeople.size === 0) { setSent({ ok: false, message: 'Pick at least one recipient.' }); return }
    const toSend = features.filter((f) => selectedFeatures.has(f.key))
    const recipients = people.filter((p) => selectedPeople.has(p.id))
    start(async () => {
      const res = await sharePackages(slug, {
        recipients: recipients.map((r) => ({ name: r.name, email: r.email })),
        items: toSend.map((t) => ({ label: t.label, url: t.url, body: t.body })),
      })
      if (res.ok) {
        setSent({ ok: true, message: `Sent to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}.` })
        setSelectedFeatures(new Set()); setSelectedPeople(new Set())
        router.refresh()
      } else {
        setSent({ ok: false, message: res.error || 'Send failed' })
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs dark:bg-white/5">
          {(['all', 'public', 'admin', 'lawyer'] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAudience(a)}
              className={`flex-1 rounded-md px-2 py-1.5 font-medium transition ${audience === a ? 'bg-white text-primary shadow dark:bg-[#11151f] dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
            >
              {a === 'all' ? 'All' : a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>

        <ul className="space-y-2">
          {filtered.map((f) => {
            const checked = selectedFeatures.has(f.key)
            return (
              <li
                key={f.key}
                className={`rounded-xl border p-3 transition ${
                  checked
                    ? 'border-primary bg-primary/5 dark:border-white/40 dark:bg-white/5'
                    : 'border-slate-200 bg-white dark:border-white/10 dark:bg-[#11151f]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={checked} onChange={() => toggleFeature(f.key)} className="h-4 w-4 cursor-pointer rounded border-slate-300" />
                  <span className="text-xl">{f.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-primary dark:text-white">{f.label}</p>
                      {f.audience.map((a) => (
                        <span key={a} className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500 dark:bg-white/10">{a}</span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">{f.body}</p>
                    <code className="mt-1 block truncate text-[11px] text-slate-400">{f.url}</code>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copy(f.label, f.url)}
                      title="Copy URL"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                    >
                      {copied === f.label ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <a
                      href={f.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open page"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-[140px] lg:self-start">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Share by email</p>
          <p className="mt-1 text-xs text-slate-500">
            {selectedFeatures.size} page{selectedFeatures.size === 1 ? '' : 's'} selected
          </p>

          <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/10">
            {people.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-500">No team members yet. Add admins or lawyers from their tabs.</p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-white/10">
                {people.map((p) => {
                  const checked = selectedPeople.has(p.id)
                  return (
                    <li key={p.id} className="px-3 py-2">
                      <label className="flex cursor-pointer items-center gap-2 text-xs">
                        <input type="checkbox" checked={checked} onChange={() => togglePerson(p.id)} className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300" />
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-600 dark:bg-white/10 dark:text-slate-300">{p.kind}</span>
                        <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{p.name}</span>
                        <span className="ml-auto truncate text-slate-400">{p.email}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {sent && (
            <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${sent.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{sent.message}</div>
          )}

          <button
            onClick={send}
            disabled={pending}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send selected
          </button>
        </div>
      </aside>
    </div>
  )
}
