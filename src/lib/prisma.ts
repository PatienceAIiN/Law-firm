import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Supabase's connection pooler needs Prisma to be told it's PgBouncer —
// otherwise Prisma opens prepared statements that PgBouncer can't reuse and
// the session pool runs out ("EMAXCONNSESSION"). Defensively append the
// right query string if it's missing, and clamp the connection_limit low
// because the pooler caps total sessions per project.
function normalizeDatabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    const isSupabasePooler = /pooler\.supabase\.com$/i.test(url.hostname)
    if (!isSupabasePooler) return raw
    if (!url.searchParams.has('pgbouncer')) url.searchParams.set('pgbouncer', 'true')
    // 5 connections lets pages that issue Promise.all([...]) for parallel
    // queries finish well under the 10s pool timeout. 1 was queueing every
    // query on a single connection and timing out with P2024.
    if (!url.searchParams.has('connection_limit')) url.searchParams.set('connection_limit', '5')
    if (!url.searchParams.has('pool_timeout')) url.searchParams.set('pool_timeout', '20')
    return url.toString()
  } catch {
    return raw
  }
}

const datasourceUrl = normalizeDatabaseUrl(process.env.DATABASE_URL)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(datasourceUrl ? { datasourceUrl } : undefined)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
