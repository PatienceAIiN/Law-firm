import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function PaymentDonePage({ params, searchParams }: { params: Promise<{ slug: string; receiptId: string }>; searchParams: Promise<{ submitted?: string }> }) {
  const { slug, receiptId } = await params
  const submitted = (await searchParams).submitted === '1'
  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, name: true, slug: true } })
  if (!tenant) notFound()
  const receipt = await prisma.receipt.findFirst({ where: { id: receiptId, tenantId: tenant.id }, select: { id: true, number: true, total: true, currency: true, clientName: true } })
  if (!receipt) notFound()
  return <main className="mx-auto max-w-lg px-4 py-10">
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Submit payment proof</h1>
      {submitted && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Payment proof uploaded successfully. Your firm will verify it shortly.</div>}
      <p className="mt-2 text-sm text-slate-600">{tenant.name} · Receipt {receipt.number} · {receipt.currency} {receipt.total.toFixed(2)}</p>
      <form action={`/api/team/${slug}/payments/submit`} method="post" encType="multipart/form-data" className="mt-6 space-y-4">
        <input type="hidden" name="receiptId" value={receipt.id} />
        <label className="block text-sm font-medium text-slate-700">UTR / transaction number
          <input name="transactionNumber" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm font-medium text-slate-700">Payment screenshot
          <input name="screenshot" type="file" accept="image/*,application/pdf" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          <span className="mt-1 block text-xs text-slate-500">Image or PDF, maximum 10 MB.</span>
        </label>
        <button className="w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Submit for verification</button>
      </form>
    </div>
  </main>
}
