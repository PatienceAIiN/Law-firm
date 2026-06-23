import type { Metadata } from 'next'
import { MarketingShell } from '@/components/layout/marketing-shell'
import { loadTenantPublicShell } from '@/lib/tenant-shell-data'
import { TenantContactForm } from '../contact-form'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const shell = await loadTenantPublicShell(slug)
  return { title: `Contact — ${shell.brand?.firm_name || shell.tenant.name}` }
}

export default async function TenantContactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const shell = await loadTenantPublicShell(slug)
  return (
    <MarketingShell brand={shell.brand} navigation={shell.navigation} officeDetails={shell.officeDetails} practiceAreas={shell.practiceAreas} tenantSlug={shell.tenant.slug}>
      <section className="mx-auto max-w-2xl rounded-2xl bg-[#0b1018] px-6 py-16 text-white">
        <h1 className="text-4xl font-bold">Contact</h1>
        <p className="mt-2 text-sm text-white/70">Tell us about your matter and we'll get back to you shortly.</p>
        <div className="mt-8">
          <TenantContactForm slug={shell.tenant.slug} />
        </div>
        {(shell.officeDetails?.email || shell.officeDetails?.phone || shell.officeDetails?.address) && (
          <div className="mt-10 grid gap-2 text-sm text-white/80">
            {shell.officeDetails.email && <p>Email: <a href={`mailto:${shell.officeDetails.email}`} className="text-[#c9a227] hover:underline">{shell.officeDetails.email}</a></p>}
            {shell.officeDetails.phone && <p>Phone: <a href={`tel:${shell.officeDetails.phone}`} className="text-[#c9a227] hover:underline">{shell.officeDetails.phone}</a></p>}
            {shell.officeDetails.address && <p>Address: {shell.officeDetails.address}</p>}
          </div>
        )}
      </section>
    </MarketingShell>
  )
}
