import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

// NextAuth options for tenant-scoped admin sessions. The tenant slug is
// supplied via the credentials payload (hidden form field on the login page)
// so we can scope email lookup to that tenant and reject cross-tenant logins.
export const tenantAdminAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'tenant-admin',
      credentials: {
        tenantSlug: { label: 'Workspace', type: 'text' },
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const tenantSlug = credentials?.tenantSlug?.toString().toLowerCase().trim()
          const email = credentials?.email?.toString().toLowerCase().trim()
          const password = credentials?.password?.toString()
          if (!tenantSlug || !email || !password) return null

          const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
          if (!tenant || tenant.status !== 'active') return null

        const user = await prisma.adminUser.findFirst({
          where: { tenantId: tenant.id, email },
        })
        if (!user) return null

        const ok = await bcrypt.compare(password, user.password)
        if (!ok) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
        } as any
        } catch (e) {
          // Never let an exception bubble up — NextAuth would turn that
          // into a 500/502 with an HTML body, which the client tries to
          // JSON.parse and explodes with "Unexpected token <".
          console.error('[admin-auth] authorize crashed:', e)
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: 'tenant-admin-session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any
        token.role = u.role
        token.adminId = u.id
        token.tenantId = u.tenantId
        token.tenantSlug = u.tenantSlug
      }
      return token
    },
    async session({ session, token }) {
      ;(session.user as any).id = token.adminId as string
      ;(session.user as any).role = token.role as string
      ;(session.user as any).tenantId = token.tenantId as string
      ;(session.user as any).tenantSlug = token.tenantSlug as string
      return session
    },
  },
  pages: {
    signIn: '/signup',
    error: '/signup',
  },
}
