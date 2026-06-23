import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | Barrister By Patience AI',
}

const SECTIONS = [
  { h: '1. Information We Collect', p: 'We collect information you provide when creating a workspace, such as firm name, email, and administrative contact details. For end-clients, we temporarily process contact details submitted through forms solely for the purpose of connecting them with their respective law firm.' },
  { h: '2. How We Use Your Information', p: 'Your information is used to provision your isolated workspace, manage your account, and provide system notifications. We do not sell your personal data or your clients\' data.' },
  { h: '3. Data Isolation and Security', p: 'Each law firm operates entirely independent of others. Data from one tenant is strictly inaccessible to other tenants. We employ standard encryption and security measures to protect this data.' },
  { h: '4. Third-Party Services', p: 'We integrate with third-party providers such as LiveKit for video meetings and Resend for emails. These services receive only the minimal data required to execute their functions.' },
  { h: '5. Cookies and Tracking', p: 'We use necessary cookies to maintain your login session and preferences. We do not use cross-site tracking cookies.' },
  { h: '6. Your Rights', p: 'You have the right to request access, correction, or deletion of your personal data. Contact our support team to exercise these rights.' },
]

export default function PlatformPrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FFFCF8] dark:bg-[#0b0f17]">
      <header className="border-b border-[#F4E8D8] bg-white px-6 py-4 dark:border-white/10 dark:bg-[#11151f]">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent dark:text-slate-200">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-bold text-primary dark:text-white">Privacy Policy</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">How Barrister By Patience AI handles and protects your data.</p>
        <div className="mt-10 space-y-6">
          {SECTIONS.map((s) => (
            <article key={s.h}>
              <h2 className="text-lg font-semibold text-primary dark:text-white">{s.h}</h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{s.p}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
