'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react'
import { signupTenant, type SignupResult } from './actions'
import { ThemeToggle } from '@/components/theme-toggle'

export default function SignupPage() {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<SignupResult | null>(null)

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await signupTenant(fd)
      setResult(r)
    })
  }

  if (result?.ok) {
    const loginPath = `/t/${result.slug}/admin/login`
    const sitePath = `/t/${result.slug}`
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#FFFCF8] px-4 py-12 dark:bg-[#0b0f17]">
      <div className="fixed right-4 top-4 z-30"><ThemeToggle /></div>
        <div className="w-full max-w-md rounded-2xl border border-[#F4E8D8] bg-white p-8 shadow-xl dark:border-white/10 dark:bg-[#11151f]">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <h1 className="mt-4 text-center text-2xl font-bold text-[#14203E] dark:text-white">Workspace created</h1>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">
            {result.emailSent
              ? <>We emailed your admin credentials to <strong>{result.email}</strong>.</>
              : 'Save the credentials shown below — Brevo is not configured to send them via email.'}
          </p>
          {result.error && (
            <div className="mt-4 break-all rounded-lg bg-amber-50 px-3 py-2 font-mono text-xs text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
              {result.error}
            </div>
          )}
          <div className="mt-6 space-y-2">
            <Link
              href={loginPath}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#14203E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1d2c52]"
            >
              Open admin login <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={sitePath} className="block text-center text-xs text-slate-500 hover:underline dark:text-slate-400">
              View your public site
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#FFFCF8] px-4 py-12 dark:bg-[#0b0f17]">
      <div className="fixed right-4 top-4 z-30"><ThemeToggle /></div>
      <div className="w-full max-w-md rounded-2xl border border-[#F4E8D8] bg-white p-8 shadow-xl dark:border-white/10 dark:bg-[#11151f]">
        <h1 className="text-2xl font-bold text-[#14203E] dark:text-white">Create your workspace</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          We'll send your admin credentials by email. Your data is isolated — new workspaces start empty.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="text-slate-700 dark:text-slate-200">Your name</span>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#14203E] focus:ring-2 focus:ring-[#14203E]/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-700 dark:text-slate-200">Firm name</span>
            <input
              name="firmName"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#14203E] focus:ring-2 focus:ring-[#14203E]/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-700 dark:text-slate-200">Workspace URL</span>
            <div className="mt-1 flex overflow-hidden rounded-lg border border-slate-300 bg-white dark:border-white/15 dark:bg-white/5">
              <span className="bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-white/10 dark:text-slate-300">/t/</span>
              <input
                name="slug"
                required
                placeholder="acme-law"
                className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none dark:text-white"
              />
            </div>
          </label>
          <label className="block text-sm">
            <span className="text-slate-700 dark:text-slate-200">Email</span>
            <input
              type="email"
              name="email"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#14203E] focus:ring-2 focus:ring-[#14203E]/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
          </label>

          {result?.error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{result.error}</div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#14203E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1d2c52] disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {pending ? 'Creating…' : 'Create workspace'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Already have a workspace? Open <code className="rounded bg-slate-100 px-1 dark:bg-white/10">/t/your-slug/admin/login</code>.
        </p>
      </div>
    </div>
  )
}
