import { prisma } from '@/lib/prisma'
import { TestimonialForm } from '@/components/admin/testimonial-form'
import { notFound } from 'next/navigation'

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const testimonial = await prisma.testimonial.findUnique({
    where: { id }
  })

  if (!testimonial) notFound()

  return (
    <div className="p-8">
      <div className="mb-12">
        <h1 className="text-3xl lg:text-5xl font-black text-navy-900 uppercase tracking-tighter">Edit Story</h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Update client feedback from {testimonial.name}</p>
      </div>

      <TestimonialForm initialData={testimonial} />
    </div>
  )
}
