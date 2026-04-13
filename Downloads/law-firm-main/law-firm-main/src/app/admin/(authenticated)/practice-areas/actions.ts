'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const practiceAreaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  content: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

export async function createPracticeArea(formData: FormData) {
  const data = {
    title: formData.get('title') as string,
    slug: formData.get('slug') as string,
    description: formData.get('description') as string,
    content: formData.get('content') as string,
    icon: formData.get('icon') as string,
    image: formData.get('image') as string,
    order: parseInt(formData.get('order') as string) || 0,
    isActive: formData.get('isActive') === 'on',
  }

  const validated = practiceAreaSchema.parse(data)

  await prisma.practiceArea.create({
    data: validated,
  })

  revalidatePath('/admin/practice-areas')
  revalidatePath('/practice-areas')
  revalidateTag('marketing-shell')
  redirect('/admin/practice-areas')
}

export async function updatePracticeArea(id: string, formData: FormData) {
  const data = {
    title: formData.get('title') as string,
    slug: formData.get('slug') as string,
    description: formData.get('description') as string,
    content: formData.get('content') as string,
    icon: formData.get('icon') as string,
    image: formData.get('image') as string,
    order: parseInt(formData.get('order') as string) || 0,
    isActive: formData.get('isActive') === 'on',
  }

  const validated = practiceAreaSchema.parse(data)

  await prisma.practiceArea.update({
    where: { id },
    data: validated,
  })

  revalidatePath('/admin/practice-areas')
  revalidatePath(`/practice-areas/${validated.slug}`)
  revalidatePath('/practice-areas')
  revalidateTag('marketing-shell')
  redirect('/admin/practice-areas')
}

export async function deletePracticeArea(id: string) {
  await prisma.practiceArea.delete({
    where: { id },
  })
  revalidatePath('/admin/practice-areas')
  revalidateTag('marketing-shell')
}
