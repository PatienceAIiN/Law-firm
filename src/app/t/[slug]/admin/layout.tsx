'use client'

import { SessionProvider } from 'next-auth/react'

export default function TenantAdminLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider basePath="/api/auth/tenant-admin">{children}</SessionProvider>
}
