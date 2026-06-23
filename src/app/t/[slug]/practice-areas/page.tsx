import type { Metadata } from 'next'
import { Briefcase } from 'lucide-react'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { loadTenantPublicShell } from '@/lib/tenant-shell-data'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const shell = await loadTenantPublicShell(slug)
  return { title: `Practice areas — ${shell.brand?.firm_name || shell.tenant.name}` }
}

export default async function TenantPracticeAreasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { tenant, brand, officeDetails, navigation, practiceAreas } = await loadTenantPublicShell(slug)

  return (
    <MarketingShell brand={brand} navigation={navigation} officeDetails={officeDetails} practiceAreas={practiceAreas} tenantSlug={tenant.slug}>
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-bold text-[#14203E] dark:text-white">Practice areas</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">What we handle for clients at {brand.firm_name || tenant.name}.</p>
        {practiceAreas.length === 0 ? (
          <p className="mt-10 text-sm text-slate-500">No practice areas published yet.</p>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {practiceAreas.map((p) => (
              <article key={p.id} className="rounded-2xl border border-[#F4E8D8] bg-white p-6 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-[#11151f]">
                <Briefcase className="h-6 w-6 text-[#14203E] dark:text-white" />
                <h2 className="mt-3 text-lg font-semibold text-[#14203E] dark:text-white">{p.title}</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{p.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </MarketingShell>
  )
}
