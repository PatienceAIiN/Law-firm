import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of Service' }

const SECTIONS = [
  { h: '1. Acceptance of Terms', p: 'By accessing this website and engaging our services, you agree to be bound by these Terms of Service and all applicable laws and regulations.' },
  { h: '2. Legal Services', p: 'Information on this website is provided for general informational purposes only and does not constitute legal advice. An attorney-client relationship is formed only upon a signed engagement agreement.' },
  { h: '3. Consultations & Bookings', p: 'Consultations may be conducted in person or via our secure virtual meeting workspace. Scheduled meetings, links and recordings are provided solely for the booked client and may not be shared.' },
  { h: '4. Fees & Receipts', p: 'Fees are communicated before engagement. Receipts issued through this portal reflect amounts received and are provided for your records.' },
  { h: '5. Confidentiality', p: 'All communications and documents shared through this platform are treated as confidential to the extent permitted by law.' },
  { h: '6. Limitation of Liability', p: 'We are not liable for any indirect or consequential loss arising from use of this website. Use of the site is at your own risk.' },
  { h: '7. Changes to Terms', p: 'We may update these terms from time to time. Continued use of the website constitutes acceptance of the revised terms.' },
]

export default function TermsPage() {
  return (
    <div className="-mt-3 min-h-screen bg-white dark:bg-[#0b0f17] sm:-mt-4">
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[#FFFCF8] dark:bg-[#0b0f17]">
        <div className="mx-auto flex max-w-[760px] flex-col items-center px-6 py-24 text-center">
          <h1 className="text-[40px] font-bold leading-[1.1] tracking-tight text-[#14203E] dark:text-white sm:text-[56px]">Terms of Service</h1>
          <p className="mt-5 max-w-[560px] text-[18px] leading-[1.6] text-[#14203E]/70 dark:text-white/70">
            Please read these terms carefully before using our services.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[760px] px-6 py-16">
        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <div key={s.h}>
              <h2 className="text-[20px] font-semibold text-[#14203E] dark:text-white">{s.h}</h2>
              <p className="mt-2 text-[16px] leading-relaxed text-[#14203E]/70 dark:text-white/65">{s.p}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
