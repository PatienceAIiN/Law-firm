import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service | Barrister By Patience AI',
}

const SECTIONS = [
  { h: '1. Acceptance of Terms', p: 'By accessing Barrister By Patience AI and engaging our services, you agree to be bound by these Terms of Service and all applicable laws and regulations.' },
  { h: '2. SaaS Platform Use', p: 'Barrister provides a software-as-a-service platform for law firms. We do not provide legal advice. All legal services facilitated through the platform are strictly between the law firm and their clients.' },
  { h: '3. Data Security & Independence', p: 'Each law firm operates as an isolated tenant. We do not cross-share client data, case files, or communications between tenants.' },
  { h: '4. Service Availability', p: 'We strive for maximum uptime but do not guarantee uninterrupted access. We reserve the right to suspend access for maintenance or updates.' },
  { h: '5. Limitation of Liability', p: 'We are not liable for any indirect or consequential loss arising from use of this platform. Use of the service is at your own risk.' },
  { h: '6. Changes to Terms', p: 'We may update these terms from time to time. Continued use of the platform constitutes acceptance of the revised terms.' },
]

export default function PlatformTermsPage() {
  return (
    <div className="min-h-screen bg-[#FFFCF8] dark:bg-[#0b0f17]">
      <header className="border-b border-[#F4E8D8] bg-white px-6 py-4 dark:border-white/10 dark:bg-[#11151f]">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent dark:text-slate-200">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-bold text-primary dark:text-white">Terms of Service</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Please read these terms carefully before using Barrister By Patience AI.</p>
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
