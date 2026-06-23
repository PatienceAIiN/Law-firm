import { getTenantBySlug } from '@/lib/tenant'
import { getTenantSettingJson } from '@/lib/tenant-settings'
import { DEFAULT_THEME } from '@/lib/theme'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return {}
  const tenantTheme = await getTenantSettingJson(tenant.id, 'site_theme') || {}
  const theme = { ...DEFAULT_THEME, ...tenantTheme }
  
  const icon = theme.logoUrl || '/favicon.png'
  
  return {
    title: {
      default: theme.siteTitle,
      template: `%s | ${theme.siteTitle}`
    },
    icons: {
      icon: icon,
      shortcut: icon,
    },
    manifest: `/team/${slug}/api/manifest?type=client`,
  }
}

function hexToHsl(hex: string) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '222.2 47.4% 11.2%'
  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255
  let max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    let d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch(max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return `${(h*360).toFixed(1)} ${(s*100).toFixed(1)}% ${(l*100).toFixed(1)}%`
}

export default async function TenantLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  // Block access if workspace is deleted or suspended
  if (tenant.status === 'deleted' || tenant.status === 'suspended') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8 text-center dark:bg-[#0b0f17]">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-sm dark:bg-[#11151f]">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {tenant.status === 'deleted' ? 'Workspace Removed' : 'Workspace Suspended'}
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            {tenant.status === 'deleted'
              ? 'This workspace has been deleted and is no longer available.'
              : 'This workspace has been temporarily suspended. Please contact the administrator.'}
          </p>
        </div>
      </div>
    )
  }

  const tenantTheme = await getTenantSettingJson(tenant.id, 'site_theme') || {}
  const theme = { ...DEFAULT_THEME, ...tenantTheme }

  return (
    <>
      {/* 
        This style block injects the tenant-specific branding into the DOM.
        We convert hex codes to HSL space-separated values so that Tailwind's 
        bg-primary (which expands to hsl(var(--primary))) resolves correctly 
        and supports alpha channels.
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary: ${hexToHsl(theme.primaryColor)};
          --secondary: ${hexToHsl(theme.secondaryColor)};
          --accent: ${hexToHsl(theme.accentColor || theme.secondaryColor)};
          --navy-900: ${theme.primaryColor};
          --gold-500: ${theme.secondaryColor};
          --radius: ${theme.borderRadius || '0.75rem'};
          --font-main: ${theme.fontFamily === 'serif' ? 'var(--font-serif)' : 'var(--font-sans)'};
        }
      `}} />
      {children}
    </>
  )
}
