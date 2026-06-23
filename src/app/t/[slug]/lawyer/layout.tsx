'use client'

import { SessionProvider } from 'next-auth/react'

export default function TenantLawyerLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider basePath="/api/auth/tenant-lawyer">{children}</SessionProvider>
}
