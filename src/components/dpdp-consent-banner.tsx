'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Shield, X } from 'lucide-react'

// Simple browser fingerprint (no external library needed)
function getBrowserFingerprint(): string {
  if (typeof window === 'undefined') return ''
  const stored = localStorage.getItem('dpdp_fp')
  if (stored) return stored

  const nav = window.navigator
  const raw = [
    nav.userAgent,
    nav.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || '',
  ].join('|')

  // Simple hash
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  const fp = 'fp_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36)
  localStorage.setItem('dpdp_fp', fp)
  return fp
}

export function DpdpConsentBanner() {
  const [visible, setVisible] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Don't show on admin/lawyer portals
    if (typeof window === 'undefined') return
    const p = window.location.pathname
    if (p.startsWith('/admin') || p.startsWith('/lawyer')) return

    // Check if user already responded
    const decision = localStorage.getItem('dpdp_consent')
    if (decision) return

    // Small delay so it doesn't flash on initial load
    const t = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(t)
  }, [])

  const respond = useCallback(async (accepted: boolean) => {
    setSaving(true)
    const fp = getBrowserFingerprint()

    try {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint: fp,
          consentGiven: accepted,
          purposes: accepted
            ? ['analytics', 'communication', 'service_improvement']
            : [],
        }),
      })
    } catch (e) {
      // Consent still recorded locally even if API fails
      console.error('Consent API error:', e)
    }

    localStorage.setItem('dpdp_consent', accepted ? 'accepted' : 'denied')
    localStorage.setItem('dpdp_consent_at', new Date().toISOString())
    setVisible(false)
    setSaving(false)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] animate-[slideUp_0.4s_ease-out] px-4 pb-4 sm:px-6">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#F4E8D8] bg-white shadow-2xl ring-1 ring-black/5 dark:border-white/10 dark:bg-[#161b28] dark:ring-white/5">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#F4E8D8] bg-[#FFFCF8] px-5 py-3.5 dark:border-white/10 dark:bg-[#1a2033]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white dark:bg-white/10">
            <Shield className="h-4 w-4" />
          </div>
          <h3 className="text-[15px] font-bold text-primary dark:text-white">
            Data Protection Notice
          </h3>
          <span className="ml-auto rounded-full bg-primary/8 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary/70 dark:bg-white/10 dark:text-white/60">
            DPDP Act 2023
          </span>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-[13px] leading-relaxed text-primary/75 dark:text-white/65">
            We value your privacy. In accordance with India&apos;s{' '}
            <strong className="font-semibold text-primary dark:text-white">
              Digital Personal Data Protection Act, 2023
            </strong>
            , we collect and process your personal data only for providing legal services,
            scheduling consultations, and improving our website. Your data is never sold to third parties.
          </p>
          <p className="mt-2 text-[12px] text-primary/55 dark:text-white/45">
            Read our{' '}
            <Link href="/privacy" className="font-medium text-primary underline decoration-dotted underline-offset-2 hover:text-primary/80 dark:text-white/80 dark:hover:text-white">
              Privacy Policy
            </Link>{' '}
            for full details on data processing, retention, and your rights as a Data Principal.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#F4E8D8] bg-[#FFFCF8]/60 px-5 py-3.5 dark:border-white/10 dark:bg-[#1a2033]/60">
          <button
            onClick={() => respond(false)}
            disabled={saving}
            className="rounded-xl border border-primary/15 px-5 py-2 text-[13px] font-semibold text-primary/70 transition-colors hover:bg-primary/5 disabled:opacity-50 dark:border-white/15 dark:text-white/60 dark:hover:bg-white/5"
          >
            Deny
          </button>
          <button
            onClick={() => respond(true)}
            disabled={saving}
            className="rounded-xl bg-primary px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent disabled:opacity-50 dark:bg-white dark:text-primary dark:hover:bg-white/90"
          >
            {saving ? 'Saving…' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  )
}
