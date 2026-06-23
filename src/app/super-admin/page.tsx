import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { ExternalLink, ShieldCheck, Users, Mail, Briefcase, FileText, Activity, Power, Trash2 } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSuperAdmin } from '@/lib/super-admin'
import { setTenantStatus, deleteTenant } from './actions'
import { SuperAdminLogoutButton } from './logout-button'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Super Admin' }

export default async function SuperAdminDashboard() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) redirect('/admin/login?callbackUrl=/super-admin')
  if (!isSuperAdmin(email)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8 text-center dark:bg-[#0b0f17]">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-sm dark:bg-[#11151f]">
          <ShieldCheck className="mx-auto h-10 w-10 text-rose-500" />
          <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">Not authorised</h1>
          <p className="mt-2 text-sm text-slate-500">Your email is not in <code className="rounded bg-slate-100 px-1 dark:bg-white/10">SUPER_ADMIN_EMAILS</code>. Ask the platform owner to add you.</p>
          <p className="mt-3 text-xs text-slate-400">Signed in as <strong>{email}</strong></p>
        </div>
      </div>
    )
  }

  const tenants = await prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } })
  const tenantStats = await Promise.all(
    tenants.map(async (t) => {
      const [adminCount, advocateCount, paCount, blogCount, inqCount, lastLogin] = await Promise.all([
        prisma.adminUser.count({ where: { tenantId: t.id } }),
        prisma.advocate.count({ where: { tenantId: t.id } }),
        prisma.practiceArea.count({ where: { tenantId: t.id } }),
        prisma.blogPost.count({ where: { tenantId: t.id } }),
        prisma.contactSubmission.count({ where: { tenantId: t.id } }),
        prisma.accessLog.findFirst({
          where: { advocate: { tenantId: t.id } },
          orderBy: { loginTime: 'desc' },
          select: { loginTime: true },
        }),
      ])
      return { tenant: t, adminCount, advocateCount, paCount, blogCount, inqCount, lastLogin: lastLogin?.loginTime || null }
    }),
  )

  const recentLogs = await prisma.accessLog.findMany({
    orderBy: { loginTime: 'desc' },
    take: 20,
    include: { advocate: { select: { name: true, email: true, tenantId: true } } },
  })
  const recentInquiries = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, fullName: true, email: true, subject: true, createdAt: true, tenantId: true },
  })
  const tenantById = new Map(tenants.map((t) => [t.id, t]))

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17]">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#11151f]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-secondary" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Super Admin</h1>
              <p className="text-xs text-slate-500">Platform-wide overview — read only</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-xs text-slate-500 sm:block">Signed in as {email}</p>
            <SuperAdminLogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {/* Tenants */}
        <section>
          <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Tenants ({tenants.length})</h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#11151f]">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Slug</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Admins</th>
                  <th className="px-4 py-3 text-right">Lawyers</th>
                  <th className="px-4 py-3 text-right">Practice</th>
                  <th className="px-4 py-3 text-right">Articles</th>
                  <th className="px-4 py-3 text-right">Inquiries</th>
                  <th className="px-4 py-3 text-left">Last lawyer login</th>
                  <th className="px-4 py-3 text-right">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {tenantStats.map(({ tenant, adminCount, advocateCount, paCount, blogCount, inqCount, lastLogin }) => (
                  <tr key={tenant.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{tenant.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{tenant.slug}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{tenant.ownerEmail}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`rounded-full px-2 py-0.5 ${tenant.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{tenant.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs">{adminCount}</td>
                    <td className="px-4 py-3 text-right text-xs">{advocateCount}</td>
                    <td className="px-4 py-3 text-right text-xs">{paCount}</td>
                    <td className="px-4 py-3 text-right text-xs">{blogCount}</td>
                    <td className="px-4 py-3 text-right text-xs">{inqCount}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{lastLogin ? new Date(lastLogin).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/team/${tenant.slug}`} target="_blank" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-slate-100 dark:text-white dark:hover:bg-white/10" title="View public site">
                          <ExternalLink className="h-3.5 w-3.5" /> Site
                        </Link>
                        <Link href={`/team/${tenant.slug}/admin/login`} target="_blank" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30" title="Go to workspace admin">
                          <ExternalLink className="h-3.5 w-3.5" /> Admin
                        </Link>
                        <form action={async () => { 'use server'; await setTenantStatus(tenant.id, tenant.status === 'active' ? 'suspended' : 'active') }}>
                          <button
                            type="submit"
                            title={tenant.status === 'active' ? 'Suspend tenant' : 'Activate tenant'}
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${tenant.status === 'active' ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'}`}
                          >
                            <Power className="h-3.5 w-3.5" /> {tenant.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </form>
                        {tenant.slug !== 'default' && (
                          <form action={async () => { 'use server'; await deleteTenant(tenant.id) }}>
                            <button
                              type="submit"
                              title="Delete tenant and all its data"
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {tenantStats.length === 0 && (
                  <tr><td colSpan={11} className="px-4 py-8 text-center text-sm text-slate-500">No tenants yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Activity */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
            <div className="mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-slate-400" /><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent lawyer logins</h3></div>
            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-500">No logins yet.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {recentLogs.map((l) => {
                  const t = l.advocate?.tenantId ? tenantById.get(l.advocate.tenantId) : null
                  return (
                    <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-white/5">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">{l.advocate?.name || 'Unknown'}</p>
                        <p className="truncate text-slate-500">{l.advocate?.email} {t ? `· ${t.slug}` : ''}</p>
                      </div>
                      <span className="shrink-0 text-slate-400">{new Date(l.loginTime).toLocaleString()}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
            <div className="mb-3 flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent inquiries</h3></div>
            {recentInquiries.length === 0 ? (
              <p className="text-xs text-slate-500">No inquiries yet.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {recentInquiries.map((i) => {
                  const t = i.tenantId ? tenantById.get(i.tenantId) : null
                  return (
                    <li key={i.id} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-white/5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">{i.fullName}</p>
                        <span className="shrink-0 text-slate-400">{new Date(i.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="truncate text-slate-500">{i.subject} · {i.email} {t ? `· ${t.slug}` : ''}</p>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
