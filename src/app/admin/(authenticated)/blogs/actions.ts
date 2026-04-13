'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const blogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  coverImage: z.string().optional(),
})

export async function createBlog(formData: FormData) {
  const data = {
    title: formData.get('title') as string,
    slug: formData.get('slug') as string,
    excerpt: formData.get('excerpt') as string,
    content: formData.get('content') as string,
    status: formData.get('status') as string,
    coverImage: formData.get('coverImage') as string,
  }

  const validated = blogSchema.parse(data)

  await prisma.blogPost.create({
    data: {
      ...validated,
      publishedAt: validated.status === 'PUBLISHED' ? new Date() : null,
    },
  })

  revalidatePath('/admin/blogs')
  revalidatePath('/blog')
  redirect('/admin/blogs')
}

export async function updateBlog(id: string, formData: FormData) {
  const data = {
    title: formData.get('title') as string,
    slug: formData.get('slug') as string,
    excerpt: formData.get('excerpt') as string,
    content: formData.get('content') as string,
    status: formData.get('status') as string,
    coverImage: formData.get('coverImage') as string,
  }

  const validated = blogSchema.parse(data)

  await prisma.blogPost.update({
    where: { id },
    data: {
      ...validated,
      publishedAt: validated.status === 'PUBLISHED' ? new Date() : null,
    },
  })

  revalidatePath('/admin/blogs')
  revalidatePath(`/blog/${validated.slug}`)
  revalidatePath('/blog')
  redirect('/admin/blogs')
}

export async function deleteBlog(id: string) {
  await prisma.blogPost.delete({
    where: { id },
  })
  revalidatePath('/admin/blogs')
}
