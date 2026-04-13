import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { BlogManager } from '@/components/admin/blog-manager'
import { Suspense } from 'react'

async function deleteAction(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  await (prisma as any).blogPost?.delete({ where: { id } })
  revalidatePath('/admin/blogs')
  revalidatePath('/')
}

export default async function BlogsPage() {
  const blogs = await (prisma as any).blogPost?.findMany({
    orderBy: { createdAt: 'desc' }
  }) || []

  return (
    <div className="p-8 space-y-12">
      <div>
        <h1 className="text-3xl lg:text-5xl font-black text-navy-900 uppercase tracking-tighter">Publications</h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Manage your law firm's digital library and news.</p>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-xs font-bold uppercase tracking-widest text-gray-400">Loading Manager...</div>}>
        <BlogManager initialBlogs={blogs} deleteAction={deleteAction} />
      </Suspense>
    </div>
  )
}
