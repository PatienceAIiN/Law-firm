'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath, revalidateTag } from 'next/cache'
import { buildGoogleMapsEmbedUrl, buildGoogleMapsSearchUrl } from '@/lib/location'

export async function updateProfile(formData: FormData) {
  const data = {
    name: formData.get('name') as string,
    title: formData.get('title') as string,
    aboutContent: formData.get('aboutContent') as string,
    profileImage: formData.get('profileImage') as string,
    socialLinks: JSON.stringify({
      linkedin: formData.get('linkedin'),
      twitter: formData.get('twitter'),
    }),
    officeDetails: JSON.stringify({
      address: formData.get('address'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      mapEmbedUrl: buildGoogleMapsEmbedUrl((formData.get('address') as string) || ''),
      mapLink: buildGoogleMapsSearchUrl((formData.get('address') as string) || ''),
    }),
  }

  await prisma.aboutProfile.upsert({
    where: { id: 'default-profile' },
    update: data,
    create: { id: 'default-profile', ...data },
  })

  revalidatePath('/admin/profile')
  revalidatePath('/about')
  revalidatePath('/')
  revalidatePath('/contact')
  revalidateTag('marketing-shell')
}

export async function updateSettings(key: string, value: any) {
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value: JSON.stringify(value) },
    create: { key, value: JSON.stringify(value) },
  })

  revalidatePath('/')
  revalidatePath('/admin/settings')
  revalidateTag('marketing-shell')
}
