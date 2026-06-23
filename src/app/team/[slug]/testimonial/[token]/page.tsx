import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getTenantBySlug } from '@/lib/tenant'
import { SubmitTestimonialForm } from './submit-form'

export const dynamic = 'force-dynamic'

export default async function TestimonialAskPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>
}) {
  const { slug, token } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const row = await prisma.testimonialAskToken.findUnique({ where: { token } })
  const invalid = !row || row.tenantId !== tenant.id
  const expired = row && row.expiresAt < new Date()
  const used = row && row.used

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFCF8] px-4 py-12 dark:bg-[#0b0f17]">
      <div className="w-full max-w-md rounded-2xl border border-[#F4E8D8] bg-white p-8 shadow-xl dark:border-white/10 dark:bg-[#11151f]">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 dark:text-white/70">{tenant.name}</p>
        <h1 className="mt-1 text-2xl font-bold text-primary dark:text-white">Share your experience</h1>
        {invalid ? (
          <p className="mt-6 rounded-lg bg-rose-50 px-3 py-3 text-sm text-rose-700">This link is not valid.</p>
        ) : expired ? (
          <p className="mt-6 rounded-lg bg-rose-50 px-3 py-3 text-sm text-rose-700">This link has expired. Ask the firm for a new invite.</p>
        ) : used ? (
          <p className="mt-6 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-700">Thanks — you've already submitted feedback. We appreciate it.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Hi {row!.clientName}, leave a quick rating + a few words. The firm reviews testimonials before publishing.
            </p>
            <SubmitTestimonialForm slug={slug} token={token} clientName={row!.clientName} />
          </>
        )}
      </div>
    </div>
  )
}
