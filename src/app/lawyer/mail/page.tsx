import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MailClient } from '@/app/admin/(authenticated)/mail/mail-client'

export const metadata = { title: 'Mail | Advocate Portal' }
export const dynamic = 'force-dynamic'

// Auth is enforced by the API endpoints; this page renders the MailClient
// directly so the OAuth round-trip doesn't bounce through the login screen.
export default function LawyerMailPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#0b0f17] dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link
          href="/lawyer/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <h1 className="mb-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Mail</h1>
        <MailClient basePath="/api/lawyer/mail" fullScreen />
      </div>
    </div>
  )
}
