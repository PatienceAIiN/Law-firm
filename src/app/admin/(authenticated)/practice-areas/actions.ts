'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createPracticeArea(formData: FormData) {
  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  const content = (formData.get('content') as string) || null
  const icon = (formData.get('icon') as string) || null
  const image = (formData.get('image') as string) || null
  const order = parseInt(formData.get('order') as string) || 0
  const isActive = formData.get('isActive') === 'on'

  await prisma.practiceArea.create({
    data: { title, slug, description, content, icon, image, order, isActive },
  })

  revalidatePath('/admin')
  revalidatePath('/practice-areas')
}

export async function updatePracticeArea(id: string, formData: FormData) {
  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  const content = (formData.get('content') as string) || null
  const icon = (formData.get('icon') as string) || null
  const image = (formData.get('image') as string) || null
  const order = parseInt(formData.get('order') as string) || 0
  const isActive = formData.get('isActive') === 'on'

  await prisma.practiceArea.update({
    where: { id },
    data: { title, slug, description, content, icon, image, order, isActive },
  })

  revalidatePath('/admin')
  revalidatePath('/practice-areas')
}

export async function deletePracticeArea(formData: FormData) {
  const id = formData.get('id') as string
  await prisma.practiceArea.delete({ where: { id } })
  revalidatePath('/admin')
  revalidatePath('/practice-areas')
}
