import { prisma } from '@/lib/prisma'
import { SiteEditor } from '@/components/admin/site-editor'
import { Suspense } from 'react'
import { createAdminUser, deleteAdminUser, updateAdminUser, updateHero, updateBrand, updateNavigation, updateFooter, updateTheme, updateContent, updateMeetingConfig } from './actions'
import { updateMetrics } from './metrics-actions'
import { getSiteTheme } from '@/lib/theme'
import { getSiteContent } from '@/lib/site-content'
import { DEFAULT_MEETING_CONFIG } from '@/lib/meeting-workspace'
import { getSitePages } from '@/lib/site-pages'

export default async function SettingsPage() {
  // Fetch overall theme and config with safety checks
  const [settings, adminUsers] = await Promise.all([
    prisma.siteSetting.findMany(),
    prisma.adminUser.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })
  ])
  const theme = await getSiteTheme()
  const content = await getSiteContent()
  const sitePages = await getSitePages()
  const metrics = await prisma.siteMetric.findMany({
    orderBy: { order: 'asc' }
  })
  
  const getConfig = (key: string, fallback: any) => {
    const s = settings.find(st => st.key === key)
    try {
      return s ? JSON.parse(s.value) : fallback
    } catch {
      return fallback
    }
  }

  const hero = getConfig('hero_content', {
    badge: 'Experienced Legal Counsel',
    title: 'Excellence in Legal Representation',
    subtitle: 'With over two decades of experience, we provide strategic legal solutions tailored to your unique needs.',
    cta_primary_text: 'Book Consultation',
    cta_secondary_text: 'Learn More',
    cta_primary_link: '/consultation',
    cta_secondary_link: '/about'
  })

  const brand = getConfig('brand_config', {
    logo_text: 'SA',
    firm_name: 'Senior Advocate',
    firm_full_name: 'Senior Advocate Law Firm'
  })

  const navigation = getConfig('navigation_links', [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Practice Areas', href: '/practice-areas' },
    { name: 'Consultation', href: '/consultation' },
    { name: 'Contact', href: '/contact' }
  ])

  const footer = getConfig('footer_config', {
    description: 'Providing exceptional legal services with integrity, expertise, and dedication to justice for over two decades.',
    legal_disclaimer: 'The information provided on this website is for general informational purposes only and does not constitute legal advice.',
    quick_links: navigation,
    office_hours: [
      'Monday - Friday: 9:00 AM - 6:00 PM',
      'Saturday: 10:00 AM - 2:00 PM',
      'Sunday: Closed'
    ]
  })
  const meetingConfig = getConfig('meeting_config', DEFAULT_MEETING_CONFIG)

  return (
    <div className="p-8">
      <div className="mb-12">
        <h1 className="text-3xl lg:text-5xl font-black text-navy-900 uppercase tracking-tighter">Site Interface</h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Zero hardcoded. Full control.</p>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-xs font-bold uppercase tracking-widest text-gray-400">Loading Interface Editor...</div>}>
        <SiteEditor 
          hero={hero}
          brand={brand}
          navigation={navigation}
          footer={footer}
          metrics={metrics}
          theme={theme}
          content={content}
          sitePages={sitePages}
          adminUsers={adminUsers}
          meetingConfig={meetingConfig}
          updateHero={updateHero}
          updateBrand={updateBrand}
          updateNavigation={updateNavigation}
          updateFooter={updateFooter}
          updateMetrics={updateMetrics}
          updateTheme={updateTheme}
          updateContent={updateContent}
          updateMeetingConfig={updateMeetingConfig}
          createAdminUser={createAdminUser}
          updateAdminUser={updateAdminUser}
          deleteAdminUser={deleteAdminUser}
        />
      </Suspense>
    </div>
  )
}
