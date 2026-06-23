import NextAuth from 'next-auth'
import { tenantLawyerAuthOptions } from '@/lib/tenant-lawyer-auth'

const handler = NextAuth(tenantLawyerAuthOptions)
export { handler as GET, handler as POST }
