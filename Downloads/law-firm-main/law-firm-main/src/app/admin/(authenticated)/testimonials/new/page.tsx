import { TestimonialForm } from '@/components/admin/testimonial-form'

export default function NewTestimonialPage() {
  return (
    <div className="p-8">
      <div className="mb-12">
        <h1 className="text-3xl lg:text-5xl font-black text-navy-900 uppercase tracking-tighter">New Story</h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Publish a new client success story</p>
      </div>

      <TestimonialForm />
    </div>
  )
}
