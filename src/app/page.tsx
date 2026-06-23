import Link from 'next/link'
import { ArrowRight, Briefcase, Users, ShieldCheck, Video, Mail, FileText, Sparkles } from 'lucide-react'
import { VideoCover, COVER_VIDEOS } from '@/components/video-cover'
import { ThemeToggle } from '@/components/theme-toggle'
import { OpenWorkspace } from '@/components/open-workspace'

export const metadata = {
  title: 'Barrister By Patience AI — Your law firm, fully online',
  description: 'A complete SaaS platform for law firms: marketing site, lawyer portal, case management, video consultations, and more.',
}

const FEATURES = [
  { icon: Briefcase, title: 'Practice areas & content', body: 'Publish practice areas and articles. Everything you change in the admin panel goes live instantly.' },
  { icon: Users, title: 'Per-firm lawyer portal', body: 'Each lawyer in your firm gets a dedicated portal — cases, hearings, receipts, mail.' },
  { icon: Video, title: 'Built-in video meetings', body: 'Host secure consultations via LiveKit. Share a link — clients join from their browser.' },
  { icon: Mail, title: 'Email & inquiries', body: 'Inquiries from your contact page land in your inbox and are forwarded to the firm owner.' },
  { icon: ShieldCheck, title: 'Data isolation', body: 'Each firm gets its own tenant. Your records, articles, and clients are never visible to anyone else.' },
  { icon: FileText, title: 'Case management', body: 'Track cases, hearings, documents, payments, and reminders inside your private workspace.' },
]

export default function SaasLandingPage() {
  return (
    <div className="min-h-screen bg-[#FFFCF8] text-primary dark:bg-[#0b0f17] dark:text-slate-100">
      {/* Header */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-400 to-slate-900 dark:from-white dark:via-slate-500 dark:to-white bg-[length:200%_auto] animate-gradient-x">Barrister</Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <OpenWorkspace />
          <Link href="/signup" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent">
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <VideoCover src={COVER_VIDEOS.home} overlay="medium" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Your law firm, fully online
          </div>
          <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            One platform. Every part of your practice.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-700 dark:text-slate-200">
            Marketing site, lawyer portal, video meetings, case files, billing, mail — all in your own private workspace.
            Set it up in minutes.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#14203E]/20 hover:bg-accent"
            >
              Create your workspace <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-white/80 px-6 py-3 text-sm font-semibold text-primary backdrop-blur hover:bg-white"
            >
              See features
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Free during preview · No credit card · Set up in under a minute
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold md:text-4xl">Everything a modern firm needs</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600 dark:text-slate-300">
          Each workspace is fully isolated. Your firm's content, clients, and people stay yours.
        </p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-[#F4E8D8] bg-white p-6 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-[#11151f]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#11151f] py-20 text-white">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-3xl font-bold md:text-4xl">From signup to live site in 60 seconds</h2>
          <ol className="mt-10 space-y-6">
            {[
              { n: '1', title: 'Sign up', body: 'Pick a workspace URL like /team/your-firm. Tell us your firm name and email.' },
              { n: '2', title: 'Get credentials', body: 'We email you an admin login. Your workspace is created with a blank canvas.' },
              { n: '3', title: 'Customize', body: 'Add practice areas, articles, lawyers, branding. Everything updates the public site instantly.' },
              { n: '4', title: 'Go live', body: 'Share your site URL. Clients book consultations, submit inquiries, meet over video.' },
            ].map((s) => (
              <li key={s.n} className="flex gap-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-sm font-bold">{s.n}</div>
                <div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-white/70">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold md:text-4xl">Ready to run your firm online?</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-300">
          Spin up a workspace, invite your team, and start taking inquiries today.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-accent"
        >
          Create your workspace <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <footer className="border-t border-[#F4E8D8] py-8 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Barrister By Patience AI · A SaaS platform for modern law firms</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-slate-800 dark:hover:text-slate-300">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-slate-800 dark:hover:text-slate-300">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
