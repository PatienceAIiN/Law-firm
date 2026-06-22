import type { Metadata } from 'next'
import { ContactForm } from '@/components/pages/contact/contact-form'
import { ContactInfo } from '@/components/pages/contact/contact-info'
import { getSiteContent } from '@/lib/site-content'
import { getMarketingShellData } from '@/lib/site-shell'
import { VideoCover, COVER_VIDEOS } from '@/components/video-cover'

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent()
  return {
    title: 'Contact Us',
    description: content.contact.hero.subtitle,
    openGraph: {
      title: 'Contact Us',
      description: content.contact.hero.subtitle,
      type: 'website',
    },
  }
}

export default async function ContactPage() {
  const [content, shell] = await Promise.all([
    getSiteContent(),
    getMarketingShellData(),
  ])

  const officeDetails = shell.officeDetails
  const officeHours = [
    'Monday - Friday: 2:00 AM - 1:00 PM',
    'Saturday: 11:00 AM - 3:00 PM',
    'Sunday: Closed',
  ]

  return (
    <div className="-mt-3 min-h-screen bg-white dark:bg-[#0b0f17] sm:-mt-4">
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden bg-[#FFFCF8] dark:bg-[#0b0f17]">
        <VideoCover src={COVER_VIDEOS.contact} />
        <div className="relative z-10 mx-auto flex max-w-[760px] flex-col items-center px-6 py-24 text-center">
          <h1 className="text-[40px] font-bold leading-[1.1] tracking-tight text-[#14203E] dark:text-white sm:text-[56px]">
            {content.contact.hero.title}
          </h1>
          <p className="mx-auto mt-5 max-w-[600px] text-[18px] leading-[1.6] text-[#14203E]/70 dark:text-white/70 sm:text-[22px]">
            {content.contact.hero.subtitle}
          </p>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-stretch">
            <div className="h-full">
              <ContactForm content={content} />
            </div>
            <div className="h-full">
              <ContactInfo contact={officeDetails} content={content} officeHours={officeHours} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
