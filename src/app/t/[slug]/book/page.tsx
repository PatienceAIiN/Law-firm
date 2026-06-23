import type { Metadata } from 'next'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { loadTenantPublicShell } from '@/lib/tenant-shell-data'
import { BookConsultation } from '../book-consultation'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const shell = await loadTenantPublicShell(slug)
  return { title: `Consult — ${shell.brand?.firm_name || shell.tenant.name}` }
}

export default async function TenantBookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const shell = await loadTenantPublicShell(slug)
  return (
    <MarketingShell brand={shell.brand} navigation={shell.navigation} officeDetails={shell.officeDetails} practiceAreas={shell.practiceAreas} tenantSlug={shell.tenant.slug}>
      <section className="mx-auto max-w-2xl rounded-2xl bg-[#11151f] px-6 py-16 text-white">
        <h1 className="text-4xl font-bold">Consult</h1>
        <p className="mt-2 text-sm text-white/70">Pick a time that works for you. We'll send a confirmation by email — with a video meeting link if you choose online.</p>
        <div className="mt-8">
          <BookConsultation slug={shell.tenant.slug} />
        </div>
      </section>
    </MarketingShell>
  )
}
