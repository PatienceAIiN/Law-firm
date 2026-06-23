import { notFound } from 'next/navigation'
import { getTenantBySlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { ActivateForm } from './activate-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Activate your account' }

export default async function LawyerActivatePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ token?: string }>
}) {
  const { slug } = await params
  const sp = searchParams ? await searchParams : {}
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const token = (sp?.token || '').toString()
  let status: 'invalid' | 'expired' | 'used' | 'ok' = 'invalid'
  let advocate: { id: string; name: string; email: string } | null = null

  if (token) {
    const row = await prisma.advocateActivationToken.findUnique({
      where: { token },
    })
    if (row) {
      if (row.used) status = 'used'
      else if (row.expiresAt < new Date()) status = 'expired'
      else {
        const adv = await prisma.advocate.findFirst({
          where: { id: row.advocateId, tenantId: tenant.id },
          select: { id: true, name: true, email: true },
        })
        if (adv) { status = 'ok'; advocate = adv }
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFCF8] px-4 py-12 dark:bg-[#0b0f17]">
      <div className="w-full max-w-md rounded-2xl border border-[#F4E8D8] bg-white p-8 shadow-xl dark:border-white/10 dark:bg-[#11151f]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)]/70 dark:text-white/70">{tenant.name}</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--primary)] dark:text-white">Activate your lawyer account</h1>
        {status === 'ok' && advocate ? (
          <>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Welcome, <strong>{advocate.name}</strong>. Set a password to activate your account.
            </p>
            <ActivateForm slug={slug} token={token} email={advocate.email} />
          </>
        ) : (
          <p className="mt-6 rounded-lg bg-rose-50 px-3 py-3 text-sm text-rose-700">
            {status === 'expired' && 'This link has expired. Ask your admin to send a new invite.'}
            {status === 'used' && 'This link has already been used. Sign in or ask your admin to resend.'}
            {status === 'invalid' && 'This activation link is not valid. Ask your admin to resend the invite.'}
          </p>
        )}
      </div>
    </div>
  )
}
