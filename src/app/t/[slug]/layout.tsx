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
  
  const icon = theme.faviconUrl || '/favicon.png'
  
  return {
    title: {
      default: theme.siteTitle,
      template: `%s | ${theme.siteTitle}`
    },
    icons: {
      icon: icon,
      shortcut: icon,
    }
  }
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

  const tenantTheme = await getTenantSettingJson(tenant.id, 'site_theme') || {}
  const theme = { ...DEFAULT_THEME, ...tenantTheme }

  return (
    <>
      {/* 
        This style block injects the tenant-specific branding into the DOM.
        Because it's rendered inside the body wrapper of the tenant routes,
        it will override the global :root CSS variables initialized in the 
        global layout for all /t/[slug]/* routes.
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary: ${theme.primaryColor};
          --secondary: ${theme.secondaryColor};
          --accent: ${theme.accentColor || theme.secondaryColor};
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
