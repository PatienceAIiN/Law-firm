import { NextResponse } from 'next/server'
import { getTenantBySlug } from '@/lib/tenant'
import { getTenantSettingJson } from '@/lib/tenant-settings'
import { DEFAULT_THEME } from '@/lib/theme'

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const url = new URL(request.url)
  const type = url.searchParams.get('type') || 'client'

  const tenant = await getTenantBySlug(slug)
  if (!tenant) return new NextResponse('Not found', { status: 404 })

  const tenantTheme = await getTenantSettingJson(tenant.id, 'site_theme') || {}
  const theme = { ...DEFAULT_THEME, ...tenantTheme }

  const iconSrc = theme.faviconUrl || '/icon-512.png'
  
  let name = theme.siteTitle || tenant.name
  let shortName = tenant.name
  let startUrl = `/t/${slug}`
  let scope = `/t/${slug}`

  if (type === 'admin') {
    name = `${tenant.name} Admin Portal`
    shortName = `${tenant.name} Admin`
    startUrl = `/t/${slug}/admin`
    scope = `/t/${slug}/admin`
  } else if (type === 'lawyer') {
    name = `${tenant.name} Lawyer Portal`
    shortName = `${tenant.name} Lawyer`
    startUrl = `/t/${slug}/lawyer`
    scope = `/t/${slug}/lawyer`
  }

  const manifest = {
    name,
    short_name: shortName,
    description: `Access portal for ${tenant.name}`,
    start_url: startUrl,
    scope,
    display: "standalone",
    background_color: "#FFFCF8",
    theme_color: theme.primaryColor || "#14203E",
    icons: [
      { src: iconSrc, sizes: "192x192", type: "image/png" },
      { src: iconSrc, sizes: "512x512", type: "image/png" },
      { src: iconSrc, sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}
