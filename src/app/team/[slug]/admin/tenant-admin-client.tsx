'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { LogOut, Plus, Trash2, ExternalLink, Briefcase, FileText, Users, Inbox, Mail, Settings, Gavel, ReceiptText, CalendarClock, UserPlus, Quote, Link as LinkIcon, Check } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  createPracticeArea, deletePracticeArea,
  createAdvocate, deleteAdvocate,
  createBlogPost, deleteBlogPost,
} from './actions'

type T = { id: string; slug: string; name: string }
type PA = { id: string; title: string; slug: string; order: number; isActive: boolean }
type BP = { id: string; title: string; slug: string; status: string }
type AV = { id: string; name: string; email: string; isActive: boolean }
type IQ = { id: string; fullName: string; email: string; subject: string; message: string; createdAt: string }

export function TenantAdminClient({
  tenant,
  currentUser,
  practiceAreas,
  blogPosts,
  advocates,
  inquiries,
}: {
  tenant: T
  currentUser: { id: string; name: string; email: string }
  practiceAreas: PA[]
  blogPosts: BP[]
  advocates: AV[]
  inquiries: IQ[]
}) {
  const [tab, setTab] = useState<'practice' | 'blogs' | 'advocates' | 'inquiries'>('practice')
  const [copiedLink, setCopiedLink] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17]">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#11151f]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold text-primary dark:text-white">{tenant.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Admin panel · {currentUser.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/team/${tenant.slug}`)
                setCopiedLink(true)
                setTimeout(() => setCopiedLink(false), 2000)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <LinkIcon className="h-3.5 w-3.5" />} Share
            </button>
            <ThemeToggle />
            <Link prefetch={true} href={`/team/${tenant.slug}/admin/cases`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
              <Gavel className="h-3.5 w-3.5" /> Cases
            </Link>
            <Link prefetch={true} href={`/team/${tenant.slug}/admin/availability`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
              <CalendarClock className="h-3.5 w-3.5" /> Availability
            </Link>
            <Link prefetch={true} href={`/team/${tenant.slug}/admin/receipts`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
              <ReceiptText className="h-3.5 w-3.5" /> Receipts
            </Link>
            <Link prefetch={true} href={`/team/${tenant.slug}/admin/team`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
              <UserPlus className="h-3.5 w-3.5" /> Team
            </Link>
            <Link prefetch={true} href={`/team/${tenant.slug}/admin/testimonials`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
              <Quote className="h-3.5 w-3.5" /> Testimonials
            </Link>
            <Link
              prefetch={true}
              href={`/team/${tenant.slug}/admin/mail`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <Mail className="h-3.5 w-3.5" /> Mail
            </Link>
            <Link
              prefetch={true}
              href={`/team/${tenant.slug}/admin/branding`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <Settings className="h-3.5 w-3.5" /> Branding
            </Link>
            <Link
              prefetch={true}
              href={`/team/${tenant.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open site
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: `/team/${tenant.slug}/admin/login` })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <nav className="mb-6 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
          {[
            { id: 'practice', label: 'Practice Areas', icon: Briefcase, count: practiceAreas.length },
            { id: 'blogs', label: 'Articles', icon: FileText, count: blogPosts.length },
            { id: 'advocates', label: 'Lawyers', icon: Users, count: advocates.length },
            { id: 'inquiries', label: 'Inquiries', icon: Inbox, count: inquiries.length },
          ].map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-white text-primary shadow dark:bg-[#11151f] dark:text-white'
                    : 'text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
                <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">{t.count}</span>
              </button>
            )
          })}
        </nav>

        {tab === 'practice' && <PracticeTab tenantSlug={tenant.slug} items={practiceAreas} />}
        {tab === 'blogs' && <BlogTab tenantSlug={tenant.slug} items={blogPosts} />}
        {tab === 'advocates' && <AdvocateTab tenantSlug={tenant.slug} items={advocates} />}
        {tab === 'inquiries' && <InquiriesTab items={inquiries} />}
      </main>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f]">{children}</div>
}

function PracticeTab({ tenantSlug, items }: { tenantSlug: string; items: PA[] }) {
  const [pending, start] = useTransition()
  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(() => { createPracticeArea(tenantSlug, fd) })
    e.currentTarget.reset()
  }
  return (
    <div className="space-y-4">
      <Card>
        <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <input name="title" required placeholder="Title (e.g. Corporate Law)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <input name="description" placeholder="Short description" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <button disabled={pending} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>
      </Card>
      <Card>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No practice areas yet — add your first one above.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {items.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-primary dark:text-white">{p.title}</p>
                  <p className="text-xs text-slate-500">{p.slug}</p>
                </div>
                <form action={async () => { await deletePracticeArea(tenantSlug, p.id) }}>
                  <button className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function BlogTab({ tenantSlug, items }: { tenantSlug: string; items: BP[] }) {
  const [pending, start] = useTransition()
  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(() => { createBlogPost(tenantSlug, fd) })
    e.currentTarget.reset()
  }
  return (
    <div className="space-y-4">
      <Card>
        <form onSubmit={onCreate} className="space-y-3">
          <input name="title" required placeholder="Article title" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <textarea name="content" rows={4} placeholder="Write your article…" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <button disabled={pending} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
            <Plus className="h-4 w-4" /> Publish article
          </button>
        </form>
      </Card>
      <Card>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No articles yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {items.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-primary dark:text-white">{b.title}</p>
                  <p className="text-xs text-slate-500">{b.slug} · {b.status}</p>
                </div>
                <form action={async () => { await deleteBlogPost(tenantSlug, b.id) }}>
                  <button className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function AdvocateTab({ tenantSlug, items }: { tenantSlug: string; items: AV[] }) {
  const [pending, start] = useTransition()
  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(() => { createAdvocate(tenantSlug, fd) })
    e.currentTarget.reset()
  }
  return (
    <div className="space-y-4">
      <Card>
        <p className="mb-3 text-xs text-slate-500">Lawyers you create here can sign in at <code className="rounded bg-slate-100 px-1 dark:bg-white/10">/team/{tenantSlug}/lawyer/login</code></p>
        <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2">
          <input name="name" required placeholder="Full name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <input name="title" placeholder="Title (e.g. Lawyer)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <input name="email" type="email" required placeholder="Email" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <input name="password" type="password" minLength={8} required placeholder="Initial password (≥ 8 chars)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white" />
          <button disabled={pending} className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
            <Plus className="h-4 w-4" /> Create lawyer
          </button>
        </form>
      </Card>
      <Card>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No lawyers yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {items.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-primary dark:text-white">{a.name}</p>
                  <p className="text-xs text-slate-500">{a.email} · {a.isActive ? 'active' : 'inactive'}</p>
                </div>
                <form action={async () => { await deleteAdvocate(tenantSlug, a.id) }}>
                  <button className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function InquiriesTab({ items }: { items: IQ[] }) {
  return (
    <Card>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No inquiries from your site yet.</p>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-white/10">
          {items.map((i) => (
            <li key={i.id} className="py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-primary dark:text-white">{i.fullName} <span className="ml-2 text-xs font-normal text-slate-500">{i.email}</span></p>
                <span className="text-xs text-slate-400">{new Date(i.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">{i.subject}</p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{i.message}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
