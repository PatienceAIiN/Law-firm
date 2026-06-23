import type { Metadata } from 'next'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { loadTenantPublicShell } from '@/lib/tenant-shell-data'
import { prisma } from '@/lib/prisma'

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
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-bold text-[#14203E] dark:text-white">Articles</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Insights from {shell.brand.firm_name || shell.tenant.name}.</p>
        {articles.length === 0 ? (
          <p className="mt-10 text-sm text-slate-500">No articles published yet.</p>
        ) : (
          <div className="mt-10 space-y-6">
            {articles.map((b) => (
              <article key={b.id} className="overflow-hidden rounded-2xl border border-[#F4E8D8] bg-white shadow-sm dark:border-white/10 dark:bg-[#11151f]">
                {b.coverImage && (
                  <img src={b.coverImage} alt="" className="h-56 w-full object-cover" />
                )}
                <div className="p-6">
                  <p className="text-xs uppercase tracking-wide text-[#c9a227]">{b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : 'Draft'}</p>
                  <h2 className="mt-1 text-xl font-semibold text-[#14203E] dark:text-white">{b.title}</h2>
                  {b.excerpt && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{b.excerpt}</p>}
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{b.content}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </MarketingShell>
  )
}
