'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { revalidateTag } from 'next/cache'
import { type SitePage } from '@/lib/site-pages'

export async function updateSitePages(pages: SitePage[]) {
  await prisma.siteSetting.upsert({
    where: { key: 'site_pages' },
    update: { value: JSON.stringify(pages) },
    create: { key: 'site_pages', value: JSON.stringify(pages) },
  })

  revalidateTag('site-pages')
  revalidatePath('/admin')
}
