'use client'

import { SessionProvider } from 'next-auth/react'

// Lawyer portal auth runs on a dedicated NextAuth route + cookie, so signIn /
// signOut here target the advocate endpoints, isolated from the admin session.
export default function LawyerLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider basePath="/api/auth/advocate">{children}</SessionProvider>
}
