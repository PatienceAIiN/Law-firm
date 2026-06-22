import { getHomeContent } from '@/lib/home-content'
import { HomeContentForm } from './home-content-form'

export const dynamic = 'force-dynamic'

export default async function HomeContentPage() {
  const content = await getHomeContent()
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-5">
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-[#14203E]">Home Page</h1>
        <p className="text-sm text-gray-500 mt-1">Edit the hero and feature cards shown on the public home page.</p>
      </div>
      <HomeContentForm initial={content} />
    </div>
  )
}
