'use client'

import { SessionProvider } from 'next-auth/react'

export function FindBarristerProviders({ children }: { children: React.ReactNode }) {
  // The Find-Barrister directory uses the client (Google SSO) NextAuth
  // pipeline — a separate cookie + basePath from admin / lawyer auth.
  return <SessionProvider basePath="/api/auth/client">{children}</SessionProvider>
}
