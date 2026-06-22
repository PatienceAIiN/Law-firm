import { unstable_cache } from 'next/cache'
import { prisma } from './prisma'
import { DEFAULT_SITE_CONTENT } from './site-content-data'

export type SiteContent = {
  home: any
  about: any
  contact: any
  consultation: any
  practiceAreasPage?: any
  practiceAreaDetail?: any
}

export { DEFAULT_SITE_CONTENT }

function parseContent(value?: string | null): SiteContent | null {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

async function loadSiteContent(): Promise<SiteContent> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'site_content' }
    })

    return {
      ...DEFAULT_SITE_CONTENT,
      ...(parseContent(setting?.value) || {})
    }
  } catch {
    return DEFAULT_SITE_CONTENT
  }
}

export const getSiteContent = unstable_cache(loadSiteContent, ['site-content'], {
  revalidate: 300,
  tags: ['site-content']
})
