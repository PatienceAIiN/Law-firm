import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const t = await prisma.tenant.findUnique({ where: { slug: 'default' } })
  if (!t) { console.error('No default tenant'); process.exit(1) }
  const updates = await Promise.all([
    prisma.testimonial.updateMany({ where: { tenantId: null }, data: { tenantId: t.id } }),
    prisma.teamMember.updateMany({ where: { tenantId: null }, data: { tenantId: t.id } }),
  ])
  console.log('Backfilled:', updates.map((u) => u.count))
}
main().finally(() => prisma.$disconnect())
