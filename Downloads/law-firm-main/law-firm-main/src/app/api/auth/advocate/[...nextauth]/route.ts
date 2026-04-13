import NextAuth from "next-auth/next"
import { advocateAuthOptions } from "@/lib/advocate-auth"

const handler = NextAuth(advocateAuthOptions)
export { handler as GET, handler as POST }
