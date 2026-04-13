import { BlogForm } from '@/components/admin/blog-form'

export default function NewBlogPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Article</h1>
        <p className="text-gray-500">Create a new blog post for your law firm website.</p>
      </div>
      
      <BlogForm />
    </div>
  )
}
