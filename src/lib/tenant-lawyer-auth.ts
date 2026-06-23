import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const tenantLawyerAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'tenant-lawyer',
      credentials: {
        tenantSlug: { label: 'Workspace', type: 'text' },
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const tenantSlug = credentials?.tenantSlug?.toString().toLowerCase().trim()
        const email = credentials?.email?.toString().toLowerCase().trim()
        const password = credentials?.password?.toString()
        if (!tenantSlug || !email || !password) return null

        const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
        if (!tenant || tenant.status !== 'active') return null

        const advocate = await prisma.advocate.findFirst({
          where: { tenantId: tenant.id, email, isActive: true },
        })
        if (!advocate) return null

        const ok = await bcrypt.compare(password, advocate.password)
        if (!ok) return null

        let ip = 'unknown'
        if (req && req.headers) {
          const xff = req.headers['x-forwarded-for']
          const xreal = req.headers['x-real-ip']
          if (xff) ip = Array.isArray(xff) ? xff[0] : xff.split(',')[0]
          else if (xreal) ip = Array.isArray(xreal) ? xreal[0] : xreal
        }

        await prisma.accessLog.create({
          data: { advocateId: advocate.id, loginTime: new Date(), ipAddress: ip },
        })

        return {
          id: advocate.id,
          email: advocate.email,
          name: advocate.name,
          role: 'lawyer',
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
        } as any
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: 'tenant-lawyer-session-token',
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
        token.advocateId = u.id
        token.tenantId = u.tenantId
        token.tenantSlug = u.tenantSlug
      }
      return token
    },
    async session({ session, token }) {
      ;(session.user as any).id = token.advocateId as string
      ;(session.user as any).role = token.role as string
      ;(session.user as any).tenantId = token.tenantId as string
      ;(session.user as any).tenantSlug = token.tenantSlug as string
      return session
    },
  },
  pages: { signIn: '/', error: '/' },
}
