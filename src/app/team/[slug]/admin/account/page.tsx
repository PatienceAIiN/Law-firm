import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { getTenantBySlug } from '@/lib/tenant'
import { TenantAdminShell } from '@/components/tenant/admin-shell'
import { ChangePasswordCard } from './change-password-card'
import { DeleteAccountCard } from './delete-account-card'
import { PaymentSettingsCard } from './payment-settings-card'
import { getPaymentConfig } from '@/lib/payments'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  return { title: `Account — ${tenant?.name || slug}` }
}

export default async function TenantAdminAccountPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) redirect(`/team/${slug}/admin/login`)
  const currentUser = { id: u.id, name: session!.user!.name || u.email, email: u.email || '' }
  const paymentCfg = await getPaymentConfig(tenant.id)
  return (
    <TenantAdminShell tenant={tenant} currentUser={currentUser}>
      <h2 className="mb-4 text-xl font-bold text-primary dark:text-white">Account</h2>
      <p className="mb-4 text-sm text-slate-500">Signed in as <strong>{currentUser.email}</strong>. Change your password below.</p>
      <ChangePasswordCard slug={slug} />
      <PaymentSettingsCard slug={slug} initial={paymentCfg} />
      <DeleteAccountCard slug={slug} tenantName={tenant.name} />
    </TenantAdminShell>
  )
}
