import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
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
