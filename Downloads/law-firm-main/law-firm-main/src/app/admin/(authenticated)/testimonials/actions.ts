'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createTestimonial(formData: FormData) {
  const data = {
    name: formData.get('name') as string,
    role: formData.get('role') as string,
    content: formData.get('content') as string,
    rating: parseInt(formData.get('rating') as string) || 5,
    order: parseInt(formData.get('order') as string) || 0,
    isActive: formData.get('isActive') === 'on'
  }

  await prisma.testimonial.create({ data })
  revalidatePath('/')
  revalidatePath('/admin/testimonials')
}

export async function updateTestimonial(id: string, formData: FormData) {
  const data = {
    name: formData.get('name') as string,
    role: formData.get('role') as string,
    content: formData.get('content') as string,
    rating: parseInt(formData.get('rating') as string) || 5,
    order: parseInt(formData.get('order') as string) || 0,
    isActive: formData.get('isActive') === 'on'
  }

  await prisma.testimonial.update({
    where: { id },
    data
  })
  revalidatePath('/')
  revalidatePath('/admin/testimonials')
}

export async function deleteTestimonial(formData: FormData) {
  const id = formData.get('id') as string
  await prisma.testimonial.delete({ where: { id } })
  revalidatePath('/')
  revalidatePath('/admin/testimonials')
}
