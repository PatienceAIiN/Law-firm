import type { Metadata } from 'next'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { loadTenantPublicShell } from '@/lib/tenant-shell-data'
import { prisma } from '@/lib/prisma'
import { TestimonialCarousel } from '@/components/tenant/testimonial-carousel'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const shell = await loadTenantPublicShell(slug)
  return { title: `Team — ${shell.brand?.firm_name || shell.tenant.name}` }
}

export default async function TenantTeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const shell = await loadTenantPublicShell(slug)
  const [team, testimonials] = await Promise.all([
    prisma.teamMember.findMany({
      where: { tenantId: shell.tenant.id, isActive: true },
      orderBy: { order: 'asc' },
    }),
    prisma.testimonial.findMany({
      where: { tenantId: shell.tenant.id, isActive: true },
      orderBy: { order: 'asc' },
    }),
  ])

  return (
    <MarketingShell brand={shell.brand} navigation={shell.navigation} officeDetails={shell.officeDetails} practiceAreas={shell.practiceAreas} tenantSlug={shell.tenant.slug}>
      <section id="team" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-16">
        <h1 className="text-4xl font-bold text-[#14203E] dark:text-white">Meet the team</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">The people behind {shell.brand.firm_name || shell.tenant.name}.</p>
        {team.length === 0 ? (
          <p className="mt-10 text-sm text-slate-500">No team members listed yet.</p>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m) => (
              <article key={m.id} className="rounded-2xl border border-[#F4E8D8] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
                <h2 className="text-lg font-semibold text-[#14203E] dark:text-white">{m.name}</h2>
                <p className="text-xs uppercase tracking-wide text-[#c9a227]">{m.title}</p>
                {m.bio && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{m.bio}</p>}
                {m.email && <p className="mt-3 text-xs text-slate-500"><a href={`mailto:${m.email}`} className="hover:underline">{m.email}</a></p>}
              </article>
            ))}
          </div>
        )}
      </section>

      {testimonials.length > 0 && (
        <section id="testimonials" className="mx-auto max-w-3xl scroll-mt-24 px-6 pb-16">
          <h2 className="text-2xl font-bold text-[#14203E] dark:text-white">What clients say</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tap or click the card to pause / play.</p>
          <div className="mt-6">
            <TestimonialCarousel
              items={testimonials.map((t) => ({ id: t.id, name: t.name, role: t.role, content: t.content, rating: t.rating }))}
            />
          </div>
        </section>
      )}
    </MarketingShell>
  )
}
