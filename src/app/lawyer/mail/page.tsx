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
    <div className="min-h-screen bg-[#FFFCF8]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link href="/lawyer/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#14203E]/70 hover:text-[#14203E]">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <h1 className="mb-4 text-2xl font-black tracking-tight text-[#14203E]">Mail</h1>
        <MailClient basePath="/api/lawyer/mail" fullScreen />
      </div>
    </div>
  )
}
