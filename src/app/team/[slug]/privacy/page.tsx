import { MarketingShell } from '@/components/layout/marketing-shell'
import { loadTenantPublicShell } from '@/lib/tenant-shell-data'

export const dynamic = 'force-dynamic'

const SECTIONS = [
  { h: '1. Information We Collect', p: 'Contact details you submit through inquiry or booking forms, communications you send us, and limited technical data (cookies, IP, browser).' },
  { h: '2. How We Use It', p: 'To respond to your inquiries, schedule consultations, deliver legal services, send transactional emails, and improve the website.' },
  { h: '3. Sharing', p: 'We do not sell personal data. We share information only with service providers (e.g., email delivery, video meetings, hosting) under strict confidentiality, or when required by law.' },
  { h: '4. Retention', p: 'Inquiries and bookings are retained for as long as needed to provide services. You may request deletion at any time.' },
  { h: '5. Your Rights', p: 'You may request access, correction, or deletion of personal data we hold about you.' },
  { h: '6. Security', p: 'We use industry-standard encryption in transit and at rest. Access is limited to authorised personnel.' },
  { h: '7. Contact', p: 'For privacy questions, contact the firm using the addresses on the Contact page.' },
]

export default async function TenantPrivacyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const shell = await loadTenantPublicShell(slug)

  return (
    <MarketingShell brand={shell.brand} navigation={shell.navigation} officeDetails={shell.officeDetails} practiceAreas={shell.practiceAreas} tenantSlug={shell.tenant.slug}>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-bold text-primary dark:text-white">Privacy Policy</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">How {shell.brand.firm_full_name || shell.tenant.name} handles your data.</p>
        <div className="mt-10 space-y-6">
          {SECTIONS.map((s) => (
            <article key={s.h}>
              <h2 className="text-lg font-semibold text-primary dark:text-white">{s.h}</h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{s.p}</p>
            </article>
          ))}
        </div>
      </section>
    </MarketingShell>
  )
}
