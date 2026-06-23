import { Metadata } from 'next'
import { LawyerProviders } from './providers'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return {
    manifest: `/t/${slug}/api/manifest?type=lawyer`,
  }
}

export default function TenantLawyerLayout({ children }: { children: React.ReactNode }) {
  return <LawyerProviders>{children}</LawyerProviders>
}
