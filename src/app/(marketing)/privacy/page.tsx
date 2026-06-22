import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy Policy' }

const SECTIONS = [
  { h: '1. Information We Collect', p: 'We collect information you provide directly — such as your name, email, phone number, and case details — when you contact us, book a consultation, or use our portal.' },
  { h: '2. How We Use Information', p: 'Your information is used to provide legal services, schedule and conduct meetings, issue receipts, respond to enquiries, and meet legal obligations.' },
  { h: '3. Meeting Recordings', p: 'Virtual meetings may be recorded for record-keeping. Recordings are stored securely and accessible only to authorised personnel and the relevant client.' },
  { h: '4. Data Sharing', p: 'We do not sell your personal data. Information is shared only with your consent, with service providers under confidentiality, or where required by law.' },
  { h: '5. Data Security', p: 'We apply reasonable technical and organisational measures to protect your data against unauthorised access, alteration or disclosure.' },
  { h: '6. Your Rights', p: 'You may request access to, correction of, or deletion of your personal data, subject to applicable legal and professional record-keeping requirements.' },
  { h: '7. Contact', p: 'For any privacy questions or requests, please contact us using the details on our Contact page.' },
]

export default function PrivacyPage() {
  return (
    <div className="-mt-3 min-h-screen bg-white dark:bg-[#0b0f17] sm:-mt-4">
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[#FFFCF8] dark:bg-[#0b0f17]">
        <div className="mx-auto flex max-w-[760px] flex-col items-center px-6 py-24 text-center">
          <h1 className="text-[40px] font-bold leading-[1.1] tracking-tight text-[#14203E] dark:text-white sm:text-[56px]">Privacy Policy</h1>
          <p className="mt-5 max-w-[560px] text-[18px] leading-[1.6] text-[#14203E]/70 dark:text-white/70">
            How we collect, use and protect your information.
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
