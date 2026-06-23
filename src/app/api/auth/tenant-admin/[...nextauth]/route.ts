import NextAuth from 'next-auth'
import { tenantAdminAuthOptions } from '@/lib/tenant-admin-auth'

const handler = NextAuth(tenantAdminAuthOptions)
export { handler as GET, handler as POST }
