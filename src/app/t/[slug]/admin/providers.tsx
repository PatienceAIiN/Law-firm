'use client'

import { SessionProvider } from 'next-auth/react'

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return <SessionProvider basePath="/api/auth/tenant-admin">{children}</SessionProvider>
}
