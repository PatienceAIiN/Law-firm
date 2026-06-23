import { Metadata } from 'next'
import { AdminProviders } from './providers'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return {
    manifest: `/team/${slug}/api/manifest?type=admin`,
  }
}

export default function TenantAdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminProviders>{children}</AdminProviders>
}
