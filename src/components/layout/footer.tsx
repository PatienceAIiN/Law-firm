import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { BrandMark } from '@/components/layout/brand-mark'

interface FooterProps {
  brand?: any
  navigation?: any[]
  practiceAreas?: any[]
  footerConfig?: any
  officeDetails?: any
  tenantSlug?: string
}

const DEFAULT_FOOTER_NAV = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Practice Areas', href: '/practice-areas' },
  { label: 'Articles', href: '/blog' },
  { label: 'Contact', href: '/contact' },
]

const DEFAULT_PRACTICE = [
  { name: 'Corporate Law' },
  { name: 'Civil Litigation' },
  { name: 'Criminal Defense' },
  { name: 'Family Law' },
]

export function Footer({ brand, navigation, practiceAreas, officeDetails, tenantSlug }: FooterProps) {
  const firmName = brand?.firm_full_name || brand?.firm_name || 'Logo'
  const tagline = brand?.tagline || brand?.description
  const homeHref = tenantSlug ? `/t/${tenantSlug}` : '/'
  const termsHref = tenantSlug ? `/t/${tenantSlug}/terms` : '/terms'
  const privacyHref = tenantSlug ? `/t/${tenantSlug}/privacy` : '/privacy'

  // Within a tenant workspace, default footer links stay inside the tenant.
  const fallbackNav = tenantSlug
    ? DEFAULT_FOOTER_NAV.map((n) => ({ ...n, href: n.href === '/' ? homeHref : `${homeHref}${n.href}` }))
    : DEFAULT_FOOTER_NAV

  const navLinks = (navigation || []).slice(0, 6)
  const finalNav = navLinks.length ? navLinks : fallbackNav
  const areas = (practiceAreas || []).slice(0, 6)
  const finalAreas = areas.length ? areas : DEFAULT_PRACTICE

  return (
    <footer className="relative left-1/2 right-1/2 -mx-[50vw] w-screen border-t border-[#F4E8D8] bg-[#FFFCF8] transition-colors dark:border-white/10 dark:bg-[#11151f]">
      <div className="mx-auto max-w-[1280px] px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand + contact */}
          <div className="lg:col-span-1">
            <BrandMark brand={brand} href={homeHref} imageHeight={36} className="text-[20px]" />
            {tagline && (
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--primary)]/60 dark:text-white/50">
                {tagline}
              </p>
            )}
            <div className="mt-5">
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]/70 dark:text-white/60">Explore</h4>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {finalNav.map((n: any, i: number) => (
                <li key={i}>
                  <Link
                    href={n.href || n.url || homeHref}
                    className="text-[var(--primary)]/70 transition-colors hover:text-[var(--primary)] dark:text-white/60 dark:hover:text-white"
                  >
                    {n.label || n.name || n.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Practice Areas */}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]/70 dark:text-white/60">Practice Areas</h4>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {finalAreas.map((p: any, i: number) => (
                <li key={i} className="text-[var(--primary)]/70 dark:text-white/60">
                  {p.title || p.name}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]/70 dark:text-white/60">Contact</h4>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {officeDetails?.email && (
                <li>
                  <a href={`mailto:${officeDetails.email}`} className="text-[var(--primary)]/70 transition-colors hover:text-[var(--primary)] dark:text-white/60 dark:hover:text-white">
                    {officeDetails.email}
                  </a>
                </li>
              )}
              {officeDetails?.phone && (
                <li>
                  <a href={`tel:${officeDetails.phone}`} className="text-[var(--primary)]/70 transition-colors hover:text-[var(--primary)] dark:text-white/60 dark:hover:text-white">
                    {officeDetails.phone}
                  </a>
                </li>
              )}
              {officeDetails?.address && (
                <li className="text-[var(--primary)]/70 dark:text-white/60">{officeDetails.address}</li>
              )}
              {!officeDetails?.email && !officeDetails?.phone && !officeDetails?.address && (
                <li className="text-[var(--primary)]/50 dark:text-white/40">Get in touch via the contact page.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-[#F4E8D8] pt-6 dark:border-white/10 sm:flex-row sm:justify-between">
          <p className="text-[13px] text-[var(--primary)]/50 dark:text-white/40">
            &copy; {new Date().getFullYear()} {firmName}. All rights reserved.
          </p>
          <nav className="flex items-center gap-6 text-[13px]">
            <Link href={termsHref} className="text-[var(--primary)]/60 transition-colors hover:text-[var(--primary)] dark:text-white/50 dark:hover:text-white">Terms of Service</Link>
            <Link href={privacyHref} className="text-[var(--primary)]/60 transition-colors hover:text-[var(--primary)] dark:text-white/50 dark:hover:text-white">Privacy Policy</Link>
            <a
              href="https://patienceai.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)]/60 transition-colors hover:text-[var(--primary)] dark:text-white/50 dark:hover:text-white"
            >
              A product of <span className="font-semibold text-[var(--primary)] dark:text-white">Barrister By Patience AI</span>
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
