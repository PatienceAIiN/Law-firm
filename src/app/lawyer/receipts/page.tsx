import { getServerSession } from 'next-auth/next'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ReceiptsManager } from '@/components/receipts/receipts-manager'

export const metadata = { title: 'Receipts | Advocate' }
export const dynamic = 'force-dynamic'

export default async function LawyerReceiptsPage() {
  const session = await getServerSession(advocateAuthOptions)
  if (!session || !session.user.id) redirect('/lawyer/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/lawyer/dashboard" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
        <div className="mb-5">
          <h1 className="text-2xl font-black tracking-tight text-[#14203E]">My Receipts</h1>
          <p className="text-sm text-gray-500 mt-1">Generate and email payment receipts to your clients.</p>
        </div>
        <ReceiptsManager />
      </div>
    </div>
  )
}
