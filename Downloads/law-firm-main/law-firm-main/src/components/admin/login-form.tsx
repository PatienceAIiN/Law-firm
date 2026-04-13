'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Mail, KeyRound, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Mode = 'login' | 'forgot' | 'otp' | 'reset' | 'done'

export function LoginForm() {
  const [mode, setMode] = useState<Mode>('login')

  // Login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Forgot/OTP/Reset state
  const [fpEmail, setFpEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)
  const [fpLoading, setFpLoading] = useState(false)
  const [fpError, setFpError] = useState('')

  const router = useRouter()

  // ── Login ──────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        setError('Invalid credentials. Please try again.')
      } else {
        router.push('/admin/dashboard')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Forgot Password — send OTP ─────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setFpLoading(true)
    setFpError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP')
      setMode('otp')
    } catch (err: any) {
      setFpError(err.message || 'Failed to send OTP')
    } finally {
      setFpLoading(false)
    }
  }

  // ── Verify OTP → Reset Password ───────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setFpError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setFpError('Password must be at least 8 characters')
      return
    }
    setFpLoading(true)
    setFpError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail, otp, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')
      setMode('done')
    } catch (err: any) {
      setFpError(err.message || 'Failed to reset password')
    } finally {
      setFpLoading(false)
    }
  }

  const backToLogin = () => {
    setMode('login')
    setFpError('')
    setFpEmail('')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
  }

  // ── Render ─────────────────────────────────────────────

  if (mode === 'done') {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="h-14 w-14 text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-[#1a1208]">Password Reset Successfully</h3>
        <p className="text-sm text-gray-500">You can now sign in with your new password.</p>
        <Button
          onClick={backToLogin}
          className="w-full bg-[#1a1208] hover:bg-[#2d1f0d] text-white rounded-xl font-bold"
        >
          Go to Login
        </Button>
      </div>
    )
  }

  if (mode === 'otp') {
    return (
      <form className="space-y-5" onSubmit={handleResetPassword}>
        <div className="flex items-center gap-2 mb-2">
          <button type="button" onClick={() => setMode('forgot')} className="text-gray-400 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <p className="text-sm text-gray-600">
            OTP sent to <strong>{fpEmail}</strong>. Check your inbox.
          </p>
        </div>

        {fpError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{fpError}</div>
        )}

        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5">6-Digit OTP</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter OTP"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-2xl font-black tracking-[0.5em] text-center text-[#1a1208] outline-none focus:ring-2 focus:ring-[#d4a853]/30"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5">New Password</label>
          <div className="relative">
            <input
              type={showNewPass ? 'text' : 'password'}
              required
              minLength={8}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#1a1208] outline-none focus:ring-2 focus:ring-[#d4a853]/30 pr-10"
            />
            <button type="button" onClick={() => setShowNewPass(v => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400">
              {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5">Confirm Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#1a1208] outline-none focus:ring-2 focus:ring-[#d4a853]/30"
          />
        </div>

        <Button
          type="submit"
          disabled={fpLoading}
          className="w-full bg-[#1a1208] hover:bg-[#2d1f0d] text-white rounded-xl font-bold py-3 h-auto"
        >
          {fpLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Resetting…</> : 'Reset Password'}
        </Button>
      </form>
    )
  }

  if (mode === 'forgot') {
    return (
      <form className="space-y-5" onSubmit={handleSendOtp}>
        <div className="flex items-center gap-2 mb-2">
          <button type="button" onClick={backToLogin} className="text-gray-400 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <p className="text-sm text-gray-600">Enter your registered admin email to receive an OTP.</p>
        </div>

        {fpError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{fpError}</div>
        )}

        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5">Admin Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              required
              value={fpEmail}
              onChange={e => setFpEmail(e.target.value)}
              placeholder="admin@lawfirm.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-[#1a1208] outline-none focus:ring-2 focus:ring-[#d4a853]/30"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={fpLoading}
          className="w-full bg-[#1a1208] hover:bg-[#2d1f0d] text-white rounded-xl font-bold py-3 h-auto"
        >
          {fpLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending OTP…</> : <><KeyRound className="h-4 w-4 mr-2" />Send OTP</>}
        </Button>
      </form>
    )
  }

  // Default: login mode
  return (
    <form className="space-y-6" onSubmit={handleLogin}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 sm:text-sm"
            placeholder="admin@lawfirm.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
        <div className="mt-1 relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 sm:text-sm pr-10"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 border-gray-300 rounded"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Remember me</label>
        </div>
        <button
          type="button"
          onClick={() => { setMode('forgot'); setFpError(''); setFpEmail(email) }}
          className="text-sm font-medium text-[#8c7355] hover:text-[#1a1208] transition-colors"
        >
          Forgot your password?
        </button>
      </div>

      <div>
        <Button
          type="submit"
          disabled={isLoading}
          className={cn(
            'w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1a1208] hover:bg-[#2d1f0d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d4a853]',
            isLoading && 'opacity-75 cursor-not-allowed'
          )}
        >
          {isLoading ? 'Signing in…' : 'Sign in'}
        </Button>
      </div>
    </form>
  )
}
