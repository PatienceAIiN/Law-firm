'use client'

import { useState } from 'react'
import { Loader2, AlertTriangle, Trash2, KeyRound } from 'lucide-react'
import { requestDeleteOtp, verifyDeleteOtpAndSoftDelete } from './actions'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

export function DeleteAccountCard({ slug, tenantName }: { slug: string, tenantName: string }) {
  const [step, setStep] = useState<'confirm' | 'otp'>('confirm')
  const [busy, setBusy] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [otp, setOtp] = useState('')
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const router = useRouter()

  const onRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus(null)
    if (confirmName !== tenantName) {
      setStatus({ ok: false, message: 'Workspace name does not match.' })
      return
    }
    setBusy(true)
    try {
      await requestDeleteOtp(slug)
      setStatus({ ok: true, message: 'OTP sent to your email.' })
      setStep('otp')
    } catch (e: any) {
      setStatus({ ok: false, message: e?.message || 'Failed to request OTP' })
    } finally {
      setBusy(false)
    }
  }

  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus(null)
    setBusy(true)
    try {
      await verifyDeleteOtpAndSoftDelete(slug, otp)
      await signOut({ callbackUrl: '/' })
    } catch (e: any) {
      setStatus({ ok: false, message: e?.message || 'Failed to delete workspace' })
      setBusy(false)
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm dark:border-rose-900/30 dark:bg-rose-900/10 sm:max-w-md">
      <div className="mb-4 flex items-center gap-2 text-rose-600 dark:text-rose-400">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="font-bold">Delete Workspace</h3>
      </div>
      <p className="mb-4 text-sm text-rose-600/80 dark:text-rose-400/80">
        This will disable access to your workspace and mark it for deletion. You will be logged out.
      </p>
      
      {step === 'confirm' ? (
        <form onSubmit={onRequestOtp} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-rose-700 dark:text-rose-300">
              Type <strong>{tenantName}</strong> to confirm:
            </label>
            <input 
              type="text" 
              required 
              value={confirmName} 
              onChange={(e) => setConfirmName(e.target.value)} 
              placeholder={tenantName}
              className="w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 dark:border-rose-800 dark:bg-black/20 dark:text-rose-100" 
            />
          </div>
          {status && (
            <div className={`rounded-lg px-3 py-2 text-sm ${status.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {status.message}
            </div>
          )}
          <button 
            disabled={busy || confirmName !== tenantName} 
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Request Deletion OTP
          </button>
        </form>
      ) : (
        <form onSubmit={onVerifyOtp} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-rose-700 dark:text-rose-300">
              Enter the OTP sent to your email:
            </label>
            <input 
              type="text" 
              required 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              placeholder="000000"
              className="w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 dark:border-rose-800 dark:bg-black/20 dark:text-rose-100" 
            />
          </div>
          {status && (
            <div className={`rounded-lg px-3 py-2 text-sm ${status.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {status.message}
            </div>
          )}
          <button 
            disabled={busy || !otp} 
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Verify OTP &amp; Delete
          </button>
          <button type="button" onClick={() => setStep('confirm')} className="ml-3 text-xs text-rose-600 hover:underline">
            Cancel
          </button>
        </form>
      )}
    </div>
  )
}
