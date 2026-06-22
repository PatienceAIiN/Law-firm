import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { BrandMark } from '@/components/layout/brand-mark'

interface FooterProps {
  brand?: any
  navigation?: any[]
  practiceAreas?: any[]
  footerConfig?: any
  officeDetails?: any
}

export function Footer({ brand, navigation, practiceAreas, officeDetails }: FooterProps) {
  const firmName = brand?.firm_full_name || brand?.firm_name || 'Logo'
  const tagline = brand?.tagline || brand?.description
  const navLinks = (navigation || []).slice(0, 6)
  const areas = (practiceAreas || []).slice(0, 6)

  return (
    <footer className="relative left-1/2 right-1/2 -mx-[50vw] w-screen border-t border-[#F4E8D8] bg-[#FFFCF8] transition-colors dark:border-white/10 dark:bg-[#11151f]">
      <div className="mx-auto max-w-[1280px] px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand + contact */}
          <div className="lg:col-span-1">
            <BrandMark brand={brand} imageHeight={36} className="text-[20px]" />
            {tagline && (
              <p className="mt-3 text-[13px] leading-relaxed text-[#14203E]/60 dark:text-white/50">
                {tagline}
              </p>
            )}
            <div className="mt-5">
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#14203E]/70 dark:text-white/60">Explore</h4>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {(navLinks.length ? navLinks : [
                { label: 'Home', href: '/' },
                { label: 'About', href: '/about' },
                { label: 'Practice Areas', href: '/practice-areas' },
                { label: 'Articles', href: '/blog' },
                { label: 'Contact', href: '/contact' },
              ]).map((n: any, i: number) => (
                <li key={i}>
                  <Link
                    href={n.href || n.url || '#'}
                    className="text-[#14203E]/70 transition-colors hover:text-[#14203E] dark:text-white/60 dark:hover:text-white"
                  >
                    {n.label || n.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Practice Areas */}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#14203E]/70 dark:text-white/60">Practice Areas</h4>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {(areas.length ? areas : [
                { name: 'Corporate Law' },
                { name: 'Civil Litigation' },
                { name: 'Criminal Defense' },
                { name: 'Family Law' },
              ]).map((p: any, i: number) => (
                <li key={i}>
                  <Link
                    href={p.slug ? `/practice-areas/${p.slug}` : '/practice-areas'}
                    className="text-[#14203E]/70 transition-colors hover:text-[#14203E] dark:text-white/60 dark:hover:text-white"
                  >
                    {p.name || p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#14203E]/70 dark:text-white/60">Contact</h4>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {officeDetails?.email && (
                <li>
                  <a href={`mailto:${officeDetails.email}`} className="text-[#14203E]/70 transition-colors hover:text-[#14203E] dark:text-white/60 dark:hover:text-white">
                    {officeDetails.email}
                  </a>
                </li>
              )}
              {officeDetails?.phone && (
                <li>
                  <a href={`tel:${officeDetails.phone}`} className="text-[#14203E]/70 transition-colors hover:text-[#14203E] dark:text-white/60 dark:hover:text-white">
                    {officeDetails.phone}
                  </a>
                </li>
              )}
              {officeDetails?.address && (
                <li className="text-[#14203E]/70 dark:text-white/60">{officeDetails.address}</li>
              )}
              {!officeDetails?.email && !officeDetails?.phone && !officeDetails?.address && (
                <li className="text-[#14203E]/50 dark:text-white/40">Get in touch via the contact page.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-[#F4E8D8] pt-6 dark:border-white/10 sm:flex-row sm:justify-between">
          <p className="text-[13px] text-[#14203E]/50 dark:text-white/40">
            &copy; {new Date().getFullYear()} {firmName}. All rights reserved.
          </p>
          <nav className="flex items-center gap-6 text-[13px]">
            <Link href="/terms" className="text-[#14203E]/60 transition-colors hover:text-[#14203E] dark:text-white/50 dark:hover:text-white">Terms of Service</Link>
            <Link href="/privacy" className="text-[#14203E]/60 transition-colors hover:text-[#14203E] dark:text-white/50 dark:hover:text-white">Privacy Policy</Link>
            <a
              href="https://patienceai.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#14203E]/60 transition-colors hover:text-[#14203E] dark:text-white/50 dark:hover:text-white"
            >
              A product of <span className="font-semibold text-[#14203E] dark:text-white">Patience AI</span>
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
