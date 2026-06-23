import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      slug: 'default',
      name: 'Default Workspace',
      ownerEmail: 'admin@lawfirm.com',
      status: 'active',
    },
  })
  console.log('Default tenant:', tenant.id)

  const updates = await Promise.all([
    prisma.adminUser.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.advocate.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.practiceArea.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.blogPost.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.siteSetting.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.contactSubmission.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.aboutProfile.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
  ])
  console.log('Backfilled rows:', updates.map((u) => u.count))
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
