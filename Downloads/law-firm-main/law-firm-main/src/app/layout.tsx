import type { Metadata } from 'next'
import { Inter, Libre_Baskerville } from 'next/font/google'
import './globals.css'
import { getSiteTheme } from '@/lib/theme'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
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
    icons: {
      icon: [{ url: faviconHref, type }],
      shortcut: faviconHref,
      apple: faviconHref,
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
      </body>
    </html>
  )
}
