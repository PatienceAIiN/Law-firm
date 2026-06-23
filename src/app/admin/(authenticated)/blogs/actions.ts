'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createBlog(formData: FormData) {
  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const excerpt = formData.get('excerpt') as string
  const content = formData.get('content') as string
  const status = formData.get('status') as string
  const coverImage = formData.get('coverImage') as string

  await prisma.blogPost.create({
    data: {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      status: status || 'DRAFT',
      coverImage: coverImage || null,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
    },
  })

  revalidatePath('/admin')
  revalidatePath('/blog')
}

export async function updateBlog(id: string, formData: FormData) {
  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const excerpt = formData.get('excerpt') as string
  const content = formData.get('content') as string
  const status = formData.get('status') as string
  const coverImage = formData.get('coverImage') as string

  const existing = await prisma.blogPost.findUnique({ where: { id } })

  await prisma.blogPost.update({
    where: { id },
    data: {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      status: status || 'DRAFT',
      coverImage: coverImage || null,
      publishedAt: status === 'PUBLISHED' && existing?.status !== 'PUBLISHED' ? new Date() : undefined,
    },
  })

  revalidatePath('/admin')
  revalidatePath('/blog')
}

export async function deleteBlog(formData: FormData) {
  const id = formData.get('id') as string
  await prisma.blogPost.delete({ where: { id } })
  revalidatePath('/admin')
  revalidatePath('/blog')
}
