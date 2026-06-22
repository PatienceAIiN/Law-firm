import type { Metadata } from 'next'
import { IBM_Plex_Sans, Libre_Baskerville } from 'next/font/google'
import './globals.css'
import { getSiteTheme } from '@/lib/theme'
import { PwaRegister } from '@/components/pwa-register'
import { ThemeAuto } from '@/components/theme-auto'
import { DpdpConsentBanner } from '@/components/dpdp-consent-banner'

const inter = IBM_Plex_Sans({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-sans' })
const serif = Libre_Baskerville({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-serif' })

function resolveIconHref(input?: string, version?: string) {
  if (!input) return '/favicon.png'
  const href = /^https?:\/\//i.test(input) || input.startsWith('/') || input.startsWith('data:')
    ? input
    : `/${input.replace(/^\/+/, '')}`
  return version ? `${href}${href.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}` : href
}

function iconTypeFromHref(href: string) {
  const cleanHref = href.split('?')[0]
  if (cleanHref.endsWith('.svg')) return 'image/svg+xml'
  if (cleanHref.endsWith('.ico')) return 'image/x-icon'
  if (cleanHref.endsWith('.jpg') || cleanHref.endsWith('.jpeg')) return 'image/jpeg'
  if (cleanHref.endsWith('.webp')) return 'image/webp'
  return 'image/png'
}

function resolveThemeIcon(theme: Awaited<ReturnType<typeof getSiteTheme>>) {
  return resolveIconHref(theme.faviconUrl, theme.updatedAt)
}

function resolveThemeIconType(theme: Awaited<ReturnType<typeof getSiteTheme>>) {
  const href = resolveIconHref(theme.faviconUrl)
  return iconTypeFromHref(href)
}

export const viewport: import('next').Viewport = {
  themeColor: '#14203E',
}

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getSiteTheme()
  const faviconHref = resolveThemeIcon(theme)
  const type = resolveThemeIconType(theme)
  return {
    title: {
      default: theme.siteTitle,
      template: `%s | ${theme.siteTitle}`
    },
    description: 'Professional legal services with expertise in corporate law, litigation, and advisory services.',
    manifest: '/manifest.webmanifest',
    appleWebApp: { capable: true, statusBarStyle: 'default', title: theme.siteTitle },
    icons: {
      icon: [{ url: faviconHref, type }],
      shortcut: faviconHref,
      apple: '/apple-touch-icon.png',
    }
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const theme = await getSiteTheme()

  return (
    <html
      lang="en"
      className={`${inter.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href={resolveIconHref(theme.faviconUrl, theme.updatedAt)} />
        {/* Apply IST-based dark/light before paint (public pages only) */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){try{
            var p=location.pathname;
            var portal=p.indexOf('/admin')===0||p.indexOf('/lawyer')===0;
            var h=parseInt(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',hour12:false}).formatToParts(new Date()).find(function(x){return x.type==='hour'}).value,10);
            var dark=!portal&&(h>=19||h<6);
            document.documentElement.classList.toggle('dark',dark);
          }catch(e){}})();
        ` }} />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: ${theme.primaryColor};
            --secondary: ${theme.secondaryColor};
            --accent: ${theme.accentColor};
            --navy-900: ${theme.primaryColor};
            --gold-500: ${theme.secondaryColor};
            --radius: ${theme.borderRadius};
            --font-main: ${theme.fontFamily === 'serif' ? 'var(--font-serif)' : 'var(--font-sans)'};
          }
          body {
            font-family: var(--font-main);
          }
        `}} />
      </head>
      <body suppressHydrationWarning>
        {children}
        <DpdpConsentBanner />
        <ThemeAuto />
        <PwaRegister />
      </body>
    </html>
  )
}
