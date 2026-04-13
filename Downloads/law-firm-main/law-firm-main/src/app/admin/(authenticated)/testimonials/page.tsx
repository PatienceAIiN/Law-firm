import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { TestimonialManager } from '@/components/admin/testimonial-manager'
import { TestimonialRequestsManager } from '@/components/admin/testimonial-requests-manager'
import { Suspense } from 'react'
import { Star, Send, Clock } from 'lucide-react'

async function deleteAction(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  await (prisma as any).testimonial?.delete({ where: { id } })
  revalidatePath('/admin/testimonials')
  revalidatePath('/')
}

async function approveRequestAction(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const request = await (prisma as any).testimonialRequest.findUnique({ where: { id } })
  if (!request || request.status !== 'SUBMITTED') return

  const testimonial = await (prisma as any).testimonial.create({
    data: {
      name: request.submittedName || request.recipientName,
      role: request.submittedRole || 'Client',
      content: request.submittedContent || '',
      rating: request.submittedRating || 5,
      isActive: true,
      order: 0,
    },
  })

  await (prisma as any).testimonialRequest.update({
    where: { id },
    data: { status: 'APPROVED', testimonialId: testimonial.id },
  })

  revalidatePath('/admin/testimonials')
  revalidatePath('/')
}

async function rejectRequestAction(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  await (prisma as any).testimonialRequest.update({
    where: { id },
    data: { status: 'REJECTED' },
  })
  revalidatePath('/admin/testimonials')
}

async function deleteRequestAction(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  await (prisma as any).testimonialRequest.delete({ where: { id } })
  revalidatePath('/admin/testimonials')
}

export default async function TestimonialsPage() {
  const [testimonials, requests] = await Promise.all([
    (prisma as any).testimonial?.findMany({ orderBy: { order: 'asc' } }) || [],
    (prisma as any).testimonialRequest?.findMany({ orderBy: { createdAt: 'desc' } }) || [],
  ])

  const pendingCount = requests.filter((r: any) => r.status === 'SUBMITTED').length
  const totalPublished = testimonials.filter((t: any) => t.isActive).length
  const totalRequests = requests.length

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-[#1a1208] tracking-tight">Testimonials</h1>
          <p className="text-sm text-gray-500 mt-1">Manage client reviews, send requests, and approve submissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#faf8f5] border border-[#e8e3dc]">
            <Star className="w-4 h-4 text-[#d4a853]" />
            <span className="text-sm font-semibold text-[#1a1208]">{totalPublished} published</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#faf8f5] border border-[#e8e3dc]">
            <Send className="w-4 h-4 text-[#8c7355]" />
            <span className="text-sm font-semibold text-[#1a1208]">{totalRequests} requests</span>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">{pendingCount} to review</span>
            </div>
          )}
        </div>
      </div>

      {/* Testimonial Requests Section — top, prominent */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-lg font-black text-[#1a1208] tracking-tight">Client Review Requests</h2>
          <span className="text-xs font-medium text-gray-400">Send an email link — client fills in their review</span>
        </div>
        <Suspense fallback={<div className="py-8 text-center text-xs text-gray-400">Loading requests...</div>}>
          <TestimonialRequestsManager
            initialRequests={requests}
            approveAction={approveRequestAction}
            rejectAction={rejectRequestAction}
            deleteRequestAction={deleteRequestAction}
          />
        </Suspense>
      </section>

      <div className="border-t border-[#e8e3dc]" />

      {/* Published Testimonials */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-lg font-black text-[#1a1208] tracking-tight">Published Testimonials</h2>
          <span className="text-xs font-medium text-gray-400">Live on your website</span>
        </div>
        <Suspense fallback={<div className="py-8 text-center text-xs text-gray-400">Loading testimonials...</div>}>
          <TestimonialManager initialData={testimonials} deleteAction={deleteAction} />
        </Suspense>
      </section>
    </div>
  )
}
