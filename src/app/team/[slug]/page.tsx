import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Star, Quote } from 'lucide-react'
import { VideoCover, COVER_VIDEOS } from '@/components/video-cover'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { loadTenantPublicShell } from '@/lib/tenant-shell-data'
import { prisma } from '@/lib/prisma'
import { TenantHero } from '@/components/tenant/tenant-hero'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const shell = await loadTenantPublicShell(slug)
  const title = shell.brand?.firm_full_name || shell.brand?.firm_name || shell.tenant.name
  // Use the tenant's uploaded logo as the browser-tab icon when set.
  const icon = shell.brand?.logo_image_url || undefined
  return icon ? { title: { absolute: title }, icons: { icon, shortcut: icon, apple: icon } } : { title: { absolute: title } }
}

export default async function TenantHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { tenant, brand, officeDetails, navigation, practiceAreas } = await loadTenantPublicShell(slug)
  const testimonial = await prisma.testimonial.findFirst({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: { order: 'asc' },
  })

  return (
    <MarketingShell brand={brand} navigation={navigation} officeDetails={officeDetails} practiceAreas={practiceAreas} tenantSlug={tenant.slug}>
      <section className="relative overflow-hidden rounded-2xl">
        <VideoCover src={brand?.home_cover_url || COVER_VIDEOS.home} overlay="medium" />
        <div className="relative z-10 mx-auto max-w-5xl px-6 py-24 text-center">
          <TenantHero
            firmFullName={brand.firm_full_name || brand.firm_name || tenant.name}
            firmName={brand.firm_name || tenant.name}
            taglines={Array.isArray((brand as any)?.hero_taglines) ? (brand as any).hero_taglines : undefined}
          />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={`/team/${tenant.slug}/book`} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-accent">
              Consult <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {testimonial && (
        <section className="mx-auto max-w-3xl px-6 pt-12">
          <Link
            href={`/team/${tenant.slug}/team`}
            className="group block rounded-2xl border border-[#F4E8D8] bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#11151f]"
          >
            <div className="flex items-center justify-between">
              <Quote className="h-7 w-7 text-secondary" />
              <div className="flex">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                ))}
              </div>
            </div>
            <blockquote className="mt-4 text-lg italic leading-relaxed text-slate-800 dark:text-slate-100">
              "{testimonial.content}"
            </blockquote>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm">
                <span className="font-semibold text-primary dark:text-white">{testimonial.name}</span>
                {testimonial.role && <span className="text-slate-500"> · {testimonial.role}</span>}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary dark:text-white">
                See more from clients <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </section>
      )}

    </MarketingShell>
  )
}
