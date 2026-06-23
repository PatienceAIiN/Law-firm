import { notFound } from 'next/navigation'
import { VideoCover, COVER_VIDEOS } from '@/components/video-cover'
import { getTenantBySlug } from '@/lib/tenant'
import { TenantLawyerLoginForm } from './login-form'

export const dynamic = 'force-dynamic'

export default async function TenantLawyerLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-[#FFFCF8] py-12 sm:px-6 lg:px-8">
      <VideoCover src={COVER_VIDEOS.about} overlay="strong" />
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary shadow-md">
            <span className="text-xl font-bold text-white">L</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">{tenant.name}</h2>
        <p className="mt-2 text-center text-sm text-primary/70">Lawyer portal</p>
      </div>
      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 px-6 py-8 shadow-xl ring-1 ring-black/5 backdrop-blur-md sm:rounded-2xl sm:px-10">
          <TenantLawyerLoginForm slug={tenant.slug} />
        </div>
      </div>
    </div>
  )
}
