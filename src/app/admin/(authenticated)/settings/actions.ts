'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath, revalidateTag } from 'next/cache'
import bcrypt from 'bcryptjs'
import { DEFAULT_SITE_PAGES, type SitePage } from '@/lib/site-pages'

export async function updateHero(formData: FormData) {
  const data = {
    badge: formData.get('badge') as string,
    title: formData.get('title') as string,
    subtitle: formData.get('subtitle') as string,
    cta_primary_text: formData.get('cta_primary_text') as string,
    cta_secondary_text: formData.get('cta_secondary_text') as string,
    cta_primary_link: formData.get('cta_primary_link') as string || '/consultation',
    cta_secondary_link: formData.get('cta_secondary_link') as string || '/about',
    heroImage: formData.get('heroImage') as string,
  }

  await prisma.siteSetting.upsert({
    where: { key: 'hero_content' },
    update: { value: JSON.stringify(data) },
    create: { key: 'hero_content', value: JSON.stringify(data) },
  })
  revalidatePath('/')
  revalidateTag('marketing-shell')
}

export async function updateBrand(formData: FormData) {
  let logoStyle: any = null
  const styleRaw = formData.get('logo_style')
  if (typeof styleRaw === 'string' && styleRaw.trim()) {
    try { logoStyle = JSON.parse(styleRaw) } catch { logoStyle = null }
  }

  const data = {
    logo_text: (formData.get('logo_text') as string) || '',
    firm_name: (formData.get('firm_name') as string) || '',
    firm_full_name: (formData.get('firm_full_name') as string) || '',
    logo_image_url: (formData.get('logo_image_url') as string) || '',
    use_image_logo: formData.get('use_image_logo') === 'on',
    logo_style: logoStyle || undefined,
  }

  await prisma.siteSetting.upsert({
    where: { key: 'brand_config' },
    update: { value: JSON.stringify(data) },
    create: { key: 'brand_config', value: JSON.stringify(data) },
  })
  revalidatePath('/')
  revalidateTag('marketing-shell')
}

export async function updateNavigation(nav: any[]) {
  await prisma.siteSetting.upsert({
    where: { key: 'navigation_links' },
    update: { value: JSON.stringify(nav) },
    create: { key: 'navigation_links', value: JSON.stringify(nav) },
  })
  revalidatePath('/')
  revalidateTag('marketing-shell')
}

export async function updateSitePages(pages: SitePage[] | string) {
  const normalized = Array.isArray(pages)
    ? pages
    : (() => {
        try {
          const parsed = JSON.parse(pages)
          return Array.isArray(parsed) ? parsed : DEFAULT_SITE_PAGES
        } catch {
          return DEFAULT_SITE_PAGES
        }
      })()

  const sanitized = normalized
    .filter((page) => page && page.title && page.slug)
    .map((page) => ({
      ...page,
      id: String(page.id || page.slug),
      title: String(page.title).trim(),
      slug: String(page.slug).trim().replace(/^\/+/, ''),
      summary: String(page.summary || '').trim(),
      content: String(page.content || '').trim(),
      heroImage: String(page.heroImage || '').trim(),
      placement: ['NAVBAR', 'FOOTER', 'BOTH', 'NONE'].includes(page.placement) ? page.placement : 'NONE',
      createdAt: page.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))

  await prisma.siteSetting.upsert({
    where: { key: 'site_pages' },
    update: { value: JSON.stringify(sanitized) },
    create: { key: 'site_pages', value: JSON.stringify(sanitized) },
  })

  revalidatePath('/')
  revalidatePath('/about')
  revalidatePath('/contact')
  revalidatePath('/consultation')
  revalidateTag('marketing-shell')
  revalidateTag('site-pages')
}

export async function updateFooter(formData: FormData) {
  const quickLinksRaw = (formData.get('quickLinksJson') as string) || '[]'
  let quickLinks: Array<{ name: string; href: string }> = []

  try {
    const parsed = JSON.parse(quickLinksRaw)
    if (Array.isArray(parsed)) {
      quickLinks = parsed
        .filter((item) => item?.name && item?.href)
        .map((item) => ({
          name: String(item.name).trim(),
          href: String(item.href).trim(),
        }))
    }
  } catch {
    quickLinks = []
  }

  const data = {
    description: formData.get('description') as string,
    legal_disclaimer: formData.get('legal_disclaimer') as string,
    office_hours: (formData.get('office_hours') as string)?.split('\n').filter(Boolean),
    quick_links: quickLinks,
  }

  await prisma.siteSetting.upsert({
    where: { key: 'footer_config' },
    update: { value: JSON.stringify(data) },
    create: { key: 'footer_config', value: JSON.stringify(data) },
  })
  revalidatePath('/')
  revalidateTag('marketing-shell')
}

export async function updateTheme(formData: FormData) {
  const primaryColor = ((formData.get('primaryColorValue') as string) || (formData.get('primaryColor') as string) || '').trim()
  const secondaryColor = ((formData.get('secondaryColorValue') as string) || (formData.get('secondaryColor') as string) || '').trim()
  const data = {
    primaryColor,
    secondaryColor,
    accentColor: ((formData.get('accentColorValue') as string) || (formData.get('accentColor') as string) || secondaryColor || primaryColor),
    siteTitle: formData.get('siteTitle') as string,
    faviconUrl: formData.get('faviconUrl') as string,
    logoUrl: formData.get('logoUrl') as string,
    borderRadius: formData.get('borderRadius') as string,
    fontFamily: formData.get('fontFamily') as string,
  }

  await prisma.siteSetting.upsert({
    where: { key: 'site_theme' },
    update: { value: JSON.stringify(data) },
    create: { key: 'site_theme', value: JSON.stringify(data) },
  })
  revalidatePath('/')
  revalidateTag('site-theme')
}

export async function updateMeetingConfig(formData: FormData) {
  const data = {
    storageMode: (formData.get('storageMode') as string) || 'SERVER',
    localSavePath: (formData.get('localSavePath') as string) || 'public/meeting-recordings',
    googleDriveFolderId: (formData.get('googleDriveFolderId') as string) || '',
    allowRecording: formData.get('allowRecording') === 'on',
    autoUploadToServer: formData.get('autoUploadToServer') === 'on',
    autoDownloadToBrowser: formData.get('autoDownloadToBrowser') === 'on',
    fullScreenByDefault: formData.get('fullScreenByDefault') === 'on',
    preferEmbeddedView: formData.get('preferEmbeddedView') === 'on',
    sameTabOnly: formData.get('sameTabOnly') === 'on',
  }

  await prisma.siteSetting.upsert({
    where: { key: 'meeting_config' },
    update: { value: JSON.stringify(data) },
    create: { key: 'meeting_config', value: JSON.stringify(data) },
  })

  revalidatePath('/admin/settings')
  revalidatePath('/admin/virtual-meetings')
  revalidatePath('/consultation')
}

export async function createAdminUser(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string)?.trim()
  const role = ((formData.get('role') as string) || 'admin').trim()

  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.adminUser.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
  })

  revalidatePath('/admin/settings')
}

export async function updateAdminUser(formData: FormData) {
  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string)?.trim()
  const role = ((formData.get('role') as string) || 'admin').trim()

  if (!id || !name || !email) {
    throw new Error('User id, name, and email are required')
  }

  await prisma.adminUser.update({
    where: { id },
    data: {
      name,
      email,
      role,
      ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
    },
  })

  revalidatePath('/admin/settings')
}

export async function deleteAdminUser(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) {
    throw new Error('User id is required')
  }

  const count = await prisma.adminUser.count()
  if (count <= 1) {
    throw new Error('At least one admin user is required')
  }

  await prisma.adminUser.delete({
    where: { id },
  })

  revalidatePath('/admin/settings')
}

export async function updateContent(formData: FormData) {
  const raw = formData.get('contentJson') as string

  let parsed: any
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Invalid JSON content')
  }

  await prisma.siteSetting.upsert({
    where: { key: 'site_content' },
    update: { value: JSON.stringify(parsed) },
    create: { key: 'site_content', value: JSON.stringify(parsed) },
  })

  revalidatePath('/')
  revalidatePath('/about')
  revalidatePath('/contact')
  revalidatePath('/consultation')
  revalidateTag('site-content')
}
