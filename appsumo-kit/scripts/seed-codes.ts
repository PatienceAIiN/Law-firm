/* eslint-disable no-console */
/**
 * Generates AppSumo redemption codes, inserts them into the database, and
 * writes a CSV (Excel-compatible) file alongside this script.
 *
 * Usage:
 *   pnpm exec tsx appsumo-kit/scripts/seed-codes.ts --count 110 --prefix PATIENCE
 */

import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

function arg(name: string, fallback: string): string {
  const flag = `--${name}`
  const idx = process.argv.indexOf(flag)
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1]
  return fallback
}

function chunk(s: string, n: number) {
  return (s.match(new RegExp(`.{1,${n}}`, 'g')) || []).join('-')
}

function genCode(prefix: string) {
  const body = crypto.randomBytes(6).toString('hex').toUpperCase()
  return `${prefix}-${chunk(body, 4)}`
}

async function main() {
  const count = parseInt(arg('count', '110'), 10)
  const prefix = arg('prefix', 'PATIENCE').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const tier = arg('tier', 'LIFETIME')

  console.log(`Generating ${count} codes with prefix "${prefix}" tier=${tier}…`)

  const codes = new Set<string>()
  while (codes.size < count) codes.add(genCode(prefix))

  const rows = Array.from(codes).map((code) => ({ code, tier, status: 'AVAILABLE' as const }))

  await prisma.appSumoCode.createMany({ data: rows, skipDuplicates: true })

  const outDir = path.resolve(__dirname, '..')
  const csvPath = path.join(outDir, 'appsumo-codes.csv')
  const header = 'code,tier,status,batch_date\n'
  const today = new Date().toISOString().slice(0, 10)
  const csv = header + rows.map((r) => `${r.code},${r.tier},${r.status},${today}`).join('\n') + '\n'
  fs.writeFileSync(csvPath, csv, 'utf8')
  console.log(`Wrote ${rows.length} codes to ${csvPath}`)

  const total = await prisma.appSumoCode.count()
  console.log(`Total codes in DB: ${total}`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
