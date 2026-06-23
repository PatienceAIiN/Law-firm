'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'
import { setTenantSettingJson } from '@/lib/tenant-settings'

export async function updateTenantBrand(slug: string, formData: FormData) {
  const session = await getServerSession(tenantAdminAuthOptions)
  const u: any = session?.user
  if (!u?.id || u.tenantSlug !== slug) throw new Error('Unauthorized')

  let logoStyle: any = null
  const styleRaw = formData.get('logo_style')
  if (typeof styleRaw === 'string' && styleRaw.trim()) {
    try { logoStyle = JSON.parse(styleRaw) } catch { logoStyle = null }
  }

  const brand = {
    logo_text: (formData.get('logo_text') as string) || '',
    firm_name: (formData.get('firm_name') as string) || '',
    firm_full_name: (formData.get('firm_full_name') as string) || '',
    logo_image_url: (formData.get('logo_image_url') as string) || '',
    use_image_logo: formData.get('use_image_logo') === 'on',
    logo_style: logoStyle || undefined,
  }

  await setTenantSettingJson(u.tenantId, 'brand_config', brand)
  revalidatePath(`/t/${slug}`)
  revalidatePath(`/t/${slug}/admin`)
}
