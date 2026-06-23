import type { Metadata } from 'next'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { loadTenantPublicShell } from '@/lib/tenant-shell-data'
import { prisma } from '@/lib/prisma'
import { TenantArticlesClient } from './articles-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const shell = await loadTenantPublicShell(slug)
  return { title: `Articles — ${shell.brand?.firm_name || shell.tenant.name}` }
}

export default async function TenantArticlesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const shell = await loadTenantPublicShell(slug)
  const articles = await prisma.blogPost.findMany({
    where: { tenantId: shell.tenant.id, status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
  })

  return (
    <MarketingShell brand={shell.brand} navigation={shell.navigation} officeDetails={shell.officeDetails} practiceAreas={shell.practiceAreas} tenantSlug={shell.tenant.slug}>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-4xl font-bold text-primary dark:text-white">Articles</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Insights from {shell.brand.firm_name || shell.tenant.name}.</p>
        <TenantArticlesClient articles={articles} />
      </section>
    </MarketingShell>
  )
}
