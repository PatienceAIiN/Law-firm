import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const t = await prisma.tenant.findUnique({ where: { slug: 'acme-law' } })
  if (t) {
    const r = await prisma.siteSetting.deleteMany({ where: { tenantId: t.id, key: 'brand_config' } })
    console.log('Deleted acme-law brand_config rows:', r.count)
  }
}
main().finally(() => prisma.$disconnect())
