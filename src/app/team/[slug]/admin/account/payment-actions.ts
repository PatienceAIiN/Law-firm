'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { setPaymentConfig, type PaymentConfig } from '@/lib/payments'

export async function savePaymentSettings(
  slug: string,
  patch: Partial<PaymentConfig>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getServerSession(tenantAdminAuthOptions)
    const u: any = session?.user
    if (!u?.id || u.tenantSlug !== slug) return { ok: false, error: 'Unauthorized' }

    // Light validation — UPI VPA pattern + IFSC pattern
    if (patch.upiVpa && !/^[\w.\-]{3,256}@[a-zA-Z]{2,64}$/.test(patch.upiVpa)) {
      return { ok: false, error: 'Invalid UPI VPA (expected name@bank format)' }
    }
    if (patch.bankIfsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(patch.bankIfsc)) {
      return { ok: false, error: 'IFSC must be 11 characters, like SBIN0001234' }
    }

    await setPaymentConfig(u.tenantId, patch)
    revalidatePath(`/team/${slug}/admin/account`)
    return { ok: true }
  } catch (e: any) {
    console.error('[savePaymentSettings]', e)
    return { ok: false, error: e?.message || 'Failed to save' }
  }
}
