import type { Metadata } from 'next'
import { ContactForm } from '@/components/pages/contact/contact-form'
import { ContactInfo } from '@/components/pages/contact/contact-info'
import { getSiteContent } from '@/lib/site-content'
import { getMarketingShellData } from '@/lib/site-shell'

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
    <div className="min-h-screen bg-white">
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#c5a059]">Contact</p>
          <h1 className="mt-4 text-3xl font-black uppercase tracking-tighter text-[#0a192f] sm:text-5xl">
            {content.contact.hero.title.split(' ')[0]}{' '}
            <span className="text-[#c5a059]">{content.contact.hero.title.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-lg">
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
