'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createTeamMember(formData: FormData) {
  const data = {
    name: formData.get('name') as string,
    title: formData.get('title') as string,
    bio: formData.get('bio') as string,
    image: (formData.get('image') as string) || null,
    expertise: (formData.get('expertise') as string) || null,
    education: (formData.get('education') as string) || null,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    linkedin: (formData.get('linkedin') as string) || null,
    order: parseInt((formData.get('order') as string) || '0', 10),
    isActive: formData.get('isActive') !== 'false',
  }

  await (prisma as any).teamMember.create({ data })
  revalidatePath('/admin/team')
  revalidatePath('/about')
}

export async function updateTeamMember(id: string, formData: FormData) {
  const data = {
    name: formData.get('name') as string,
    title: formData.get('title') as string,
    bio: formData.get('bio') as string,
    image: (formData.get('image') as string) || null,
    expertise: (formData.get('expertise') as string) || null,
    education: (formData.get('education') as string) || null,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    linkedin: (formData.get('linkedin') as string) || null,
    order: parseInt((formData.get('order') as string) || '0', 10),
    isActive: formData.get('isActive') !== 'false',
  }

  await (prisma as any).teamMember.update({ where: { id }, data })
  revalidatePath('/admin/team')
  revalidatePath('/about')
}

export async function deleteTeamMember(formData: FormData) {
  const id = formData.get('id') as string
  await (prisma as any).teamMember.delete({ where: { id } })
  revalidatePath('/admin/team')
  revalidatePath('/about')
}
