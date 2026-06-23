'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { PasswordInput } from '@/components/ui/password-input'

export function TenantLawyerLoginForm({ slug }: { slug: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    const res = await signIn('credentials', {
      tenantSlug: slug,
      email,
      password,
      redirect: false,
    })
    if (res?.error || !res?.ok) {
      setError('Invalid email or password for this workspace.')
      setBusy(false)
      return
    }
    window.location.href = `/t/${slug}/lawyer`
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm">
        <span className="text-slate-700">Email</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#14203E] focus:outline-none focus:ring-2 focus:ring-[#14203E]/20" />
      </label>
      <label className="block text-sm">
        <span className="text-slate-700">Password</span>
        <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#14203E] focus:outline-none focus:ring-2 focus:ring-[#14203E]/20" />
      </label>
      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <button type="submit" disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#14203E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1d2c52] disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
