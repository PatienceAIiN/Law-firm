import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const advocateAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "advocate-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const advocate = await prisma.advocate.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!advocate || !advocate.isActive) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          advocate.password
        )

        if (!isPasswordValid) {
          return null
        }

        // Log access
        await prisma.accessLog.create({
          data: {
            advocateId: advocate.id,
            loginTime: new Date(),
            ipAddress: "unknown", // Would need to get from request in real scenario
          }
        })

        return {
          id: advocate.id,
          email: advocate.email,
          name: advocate.name,
          role: "advocate"
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Separate cookie so advocate and admin sessions never collide.
  cookies: {
    sessionToken: {
      name: "advocate-session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.advocateId = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.advocateId as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: "/lawyer/login",
    error: "/lawyer/login"
  }
}
