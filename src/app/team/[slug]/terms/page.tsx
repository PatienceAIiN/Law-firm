import { MarketingShell } from '@/components/layout/marketing-shell'
import { loadTenantPublicShell } from '@/lib/tenant-shell-data'
import { getTenantSettingValue } from '@/lib/tenant-settings'

export const dynamic = 'force-dynamic'

const SECTIONS = [
  { h: '1. Acceptance of Terms', p: 'By accessing this website and engaging our services, you agree to be bound by these Terms of Service and all applicable laws and regulations.' },
  { h: '2. Legal Services', p: 'Information on this website is provided for general informational purposes only and does not constitute legal advice. An attorney-client relationship is formed only upon a signed engagement agreement.' },
  { h: '3. Consultations & Bookings', p: 'Consultations may be conducted in person or via our secure virtual meeting workspace. Scheduled meetings, links and recordings are provided solely for the booked client and may not be shared.' },
  { h: '4. Fees & Receipts', p: 'Fees are communicated before engagement. Receipts issued through this portal reflect amounts received and are provided for your records.' },
  { h: '5. Confidentiality', p: 'All communications and documents shared through this platform are treated as confidential to the extent permitted by law.' },
  { h: '6. Limitation of Liability', p: 'We are not liable for any indirect or consequential loss arising from use of this website. Use of the site is at your own risk.' },
  { h: '7. Changes to Terms', p: 'We may update these terms from time to time. Continued use of the website constitutes acceptance of the revised terms.' },
]

export default async function TenantTermsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const shell = await loadTenantPublicShell(slug)
  const customHtml = await getTenantSettingValue(shell.tenant.id, 'terms_html')

  return (
    <MarketingShell brand={shell.brand} navigation={shell.navigation} officeDetails={shell.officeDetails} practiceAreas={shell.practiceAreas} tenantSlug={shell.tenant.slug}>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-bold text-primary dark:text-white">Terms of Service</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Please read these terms carefully before using {shell.brand.firm_full_name || shell.tenant.name}.</p>
        {customHtml ? (
          <div
            className="prose prose-slate mt-10 max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: customHtml }}
          />
        ) : (
          <div className="mt-10 space-y-6">
            {SECTIONS.map((s) => (
              <article key={s.h}>
                <h2 className="text-lg font-semibold text-primary dark:text-white">{s.h}</h2>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{s.p}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </MarketingShell>
  )
}
