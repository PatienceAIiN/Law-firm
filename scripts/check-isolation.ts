import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const tenants = await prisma.tenant.findMany({ select: { slug: true, name: true } })
  console.log('Tenants:', tenants)
  for (const t of tenants) {
    const tenant = await prisma.tenant.findUnique({ where: { slug: t.slug } })
    const pa = await prisma.practiceArea.count({ where: { tenantId: tenant!.id } })
    const bp = await prisma.blogPost.count({ where: { tenantId: tenant!.id } })
    const av = await prisma.advocate.count({ where: { tenantId: tenant!.id } })
    const ss = await prisma.siteSetting.count({ where: { tenantId: tenant!.id } })
    console.log(`  ${t.slug}: practiceAreas=${pa}, blogPosts=${bp}, advocates=${av}, siteSettings=${ss}`)
  }
}
main().finally(() => prisma.$disconnect())
