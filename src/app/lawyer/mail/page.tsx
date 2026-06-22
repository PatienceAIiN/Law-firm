import { getServerSession } from 'next-auth/next'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MailClient } from '@/app/admin/(authenticated)/mail/mail-client'

export const metadata = { title: 'Mail | Advocate Portal' }
export const dynamic = 'force-dynamic'

export default async function LawyerMailPage() {
  const session = await getServerSession(advocateAuthOptions)
  if (!session || !session.user.id) redirect('/lawyer/login')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link href="/lawyer/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <h1 className="mb-4 text-2xl font-black tracking-tight text-foreground">Mail</h1>
        <MailClient basePath="/api/lawyer/mail" fullScreen />
      </div>
    </div>
  )
}
