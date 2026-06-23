'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createTestimonial(formData: FormData) {
  const name = formData.get('name') as string
  const role = (formData.get('role') as string) || null
  const content = formData.get('content') as string
  const rating = parseInt(formData.get('rating') as string) || 5
  const image = (formData.get('image') as string) || null
  const order = parseInt(formData.get('order') as string) || 0
  const isActive = formData.get('isActive') === 'on'

  await prisma.testimonial.create({
    data: { name, role, content, rating, image, order, isActive },
  })

  revalidatePath('/admin')
}

export async function updateTestimonial(id: string, formData: FormData) {
  const name = formData.get('name') as string
  const role = (formData.get('role') as string) || null
  const content = formData.get('content') as string
  const rating = parseInt(formData.get('rating') as string) || 5
  const image = (formData.get('image') as string) || null
  const order = parseInt(formData.get('order') as string) || 0
  const isActive = formData.get('isActive') === 'on'

  await prisma.testimonial.update({
    where: { id },
    data: { name, role, content, rating, image, order, isActive },
  })

  revalidatePath('/admin')
}

export async function deleteTestimonial(formData: FormData) {
  const id = formData.get('id') as string
  await prisma.testimonial.delete({ where: { id } })
  revalidatePath('/admin')
}
