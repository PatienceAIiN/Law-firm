import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'

// Public end-user auth — for clients using /find-barrister to chat /
// request video / message lawyers. Distinct cookie + JWT so it never
// collides with the admin or lawyer sessions.
export const clientAuthOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    // Email-OTP fallback: caller first hits /api/auth/email-otp/request to
    // get an OTP mailed, then supplies { email, otp, name } here to sign in.
    CredentialsProvider({
      id: 'email-otp',
      name: 'Email OTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        otp: { label: 'OTP', type: 'text' },
        name: { label: 'Name', type: 'text' },
      },
      async authorize(creds) {
        try {
          const email = (creds?.email || '').toString().trim().toLowerCase()
          const otp = (creds?.otp || '').toString().trim()
          if (!email || !otp) return null
          const row = await prisma.clientLoginOtp.findFirst({
            where: { email },
            orderBy: { createdAt: 'desc' },
          })
          if (!row) return null
          if (row.expiresAt < new Date()) return null
          if (row.attempts >= 5) return null
          if (row.otp !== otp) {
            await prisma.clientLoginOtp.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } })
            return null
          }
          await prisma.clientLoginOtp.delete({ where: { id: row.id } }).catch(() => null)
          const user = await prisma.clientUser.upsert({
            where: { email },
            update: { name: (creds?.name as string) || undefined },
            create: { email, name: (creds?.name as string) || null },
          })
          return { id: user.id, email: user.email, name: user.name || undefined, image: user.image || undefined } as any
        } catch (e) {
          console.error('[email-otp authorize]', e)
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: 'client-session-token',
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production' },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      try {
        const email = (user?.email || '').toLowerCase().trim()
        if (!email) return false
        const googleId = (account?.providerAccountId || '') as string
        await prisma.clientUser.upsert({
          where: { email },
          update: { name: user?.name || undefined, image: user?.image || undefined, googleId: googleId || undefined },
          create: { email, name: user?.name || null, image: user?.image || null, googleId: googleId || null },
        })
      } catch (e) {
        console.warn('[client-auth] upsert failed:', (e as any)?.message)
      }
      return true
    },
    async jwt({ token, user }) {
      if (user?.email) token.email = user.email
      if (user?.name) token.name = user.name
      if ((user as any)?.image) token.picture = (user as any).image
      return token
    },
    async session({ session, token }) {
      ;(session.user as any).email = token.email
      ;(session.user as any).name = token.name
      ;(session.user as any).image = token.picture
      return session
    },
  },
  pages: { signIn: '/find-barrister', error: '/find-barrister' },
}
