'use server'

import { prisma } from '@/lib/prisma'

export type RedeemCheckResult =
  | { ok: true; code: string; tier: string }
  | { ok: false; error: string }

export async function checkAppSumoCode(rawCode: string): Promise<RedeemCheckResult> {
  const code = (rawCode || '').toString().trim().toUpperCase()
  if (!code || code.length < 6) return { ok: false, error: 'Enter a redemption code.' }

  const row = await prisma.appSumoCode.findUnique({ where: { code } })
  if (!row) return { ok: false, error: 'That code is not recognized. Double-check it from your AppSumo email.' }
  if (row.status === 'REDEEMED') return { ok: false, error: 'That code has already been redeemed.' }
  if (row.status === 'REVOKED') return { ok: false, error: 'That code is no longer valid.' }

  return { ok: true, code: row.code, tier: row.tier }
}
