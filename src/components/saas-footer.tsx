'use client'

import { useState } from 'react'
import { SaasContactModal } from './saas-contact-modal'

export function SaasFooter() {
  const [open, setOpen] = useState(false)
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-[#F4E8D8] py-8 text-center text-xs text-slate-500 dark:border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 sm:flex-row">
        <p>
          © {year}{' '}
          <a href="https://patienceai.in" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#14203E] hover:underline dark:text-white">
            Patience AI
          </a>{' '}
          · A SaaS platform for modern law firms
        </p>
        <div className="flex items-center gap-5">
          <button type="button" onClick={() => setOpen(true)} className="text-slate-600 transition-colors hover:text-[#14203E] dark:text-slate-300 dark:hover:text-white">
            Contact
          </button>
          <a href="/terms" className="text-slate-600 transition-colors hover:text-[#14203E] dark:text-slate-300 dark:hover:text-white">Terms</a>
          <a href="/privacy" className="text-slate-600 transition-colors hover:text-[#14203E] dark:text-slate-300 dark:hover:text-white">Privacy</a>
          <a href="https://patienceai.in" target="_blank" rel="noopener noreferrer" className="text-slate-600 transition-colors hover:text-[#14203E] dark:text-slate-300 dark:hover:text-white">
            patienceai.in
          </a>
        </div>
      </div>
      {open && <SaasContactModal onClose={() => setOpen(false)} />}
    </footer>
  )
}
