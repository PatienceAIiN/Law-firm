import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'

interface FooterProps {
  brand?: any
  navigation?: any[]
  practiceAreas?: any[]
  footerConfig?: any
  officeDetails?: any
}

export function Footer({ brand, navigation, practiceAreas: sitePracticeAreas, footerConfig, officeDetails }: FooterProps) {
  const practiceAreas = sitePracticeAreas || []
  const quickLinks = (footerConfig?.quick_links?.length ? footerConfig.quick_links : navigation || [])
    .filter((link: { name?: string; href?: string }) => link?.href !== '/blog' && link?.name !== 'Blog')

  const renderLink = (label: string, href: string) => {
    if (href.includes('#')) {
      return (
        <a href={href} className="text-slate-700 transition-colors hover:text-[#0a192f]">
          {label}
        </a>
      )
    }

    return (
      <Link href={href} className="text-slate-700 transition-colors hover:text-[#0a192f]">
        {label}
      </Link>
    )
  }

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-700">
      <div className="mx-auto max-w-[1680px] px-3 py-5 sm:px-4 lg:px-6">
        <div className="grid gap-6 rounded-[28px] border border-slate-200 bg-white px-4 py-5 shadow-sm lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0a192f] text-lg font-black text-white">
                <span>{brand?.logo_text || 'SA'}</span>
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.24em] text-[#0a192f]">{brand?.firm_name || 'Senior Advocate'}</p>
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Legal Advisory</p>
              </div>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-600">
              {footerConfig?.description || 'Focused legal counsel with clear strategy, disciplined execution, and responsive client support.'}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#0a192f]">Rights & Policy</p>
              <div className="grid gap-2 text-sm">
                {quickLinks.map((link: { name: string; href: string }) => (
                  <div key={link.name}>
                    {renderLink(link.name, link.href)}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#0a192f]">Practice Areas</p>
              <div className="grid gap-2 text-sm">
                {practiceAreas.slice(0, 4).map((area) => (
                  <Link key={area.id} href={`/practice-areas/${area.slug}`} className="text-slate-700 transition-colors hover:text-[#0a192f]">
                    {area.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#0a192f]">Contact</p>
            <div className="space-y-3 text-sm text-slate-600">
              {officeDetails?.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0a192f]" />
                  <div className="leading-6">{officeDetails.address}</div>
                </div>
              )}
              {officeDetails?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 flex-shrink-0 text-[#0a192f]" />
                  <a href={`tel:${officeDetails.phone}`} className="transition-colors hover:text-[#0a192f]">
                    {officeDetails.phone}
                  </a>
                </div>
              )}
              {officeDetails?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 flex-shrink-0 text-[#0a192f]" />
                  <a href={`mailto:${officeDetails.email}`} className="truncate transition-colors hover:text-[#0a192f]">
                    {officeDetails.email}
                  </a>
                </div>
              )}
              {officeDetails?.mapLink && (
                <a
                  href={officeDetails.mapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#0a192f] transition-colors hover:border-[#0a192f] hover:text-[#0a192f]"
                >
                  View Map
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 text-[11px] text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} {brand?.firm_full_name || 'Senior Advocate Law Firm'}. All rights reserved.</p>
          <p className="max-w-3xl text-left leading-5 md:text-right">
            {footerConfig?.legal_disclaimer || 'Disclaimer: Information on this website is general in nature and does not constitute legal advice.'}
          </p>
        </div>
      </div>
    </footer>
  )
}
