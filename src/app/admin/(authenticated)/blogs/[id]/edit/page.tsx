import { BlogForm } from '@/components/admin/blog-form'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export default async function EditBlogPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const blog = await prisma.blogPost.findUnique({
    where: { id }
  })

  if (!blog) {
    notFound()
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Article</h1>
        <p className="text-gray-500">Modify the article details below.</p>
      </div>
      
      <BlogForm initialData={blog} />
    </div>
  )
}
