import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = 'AcmeTest123!'
  const hashed = await bcrypt.hash(password, 10)
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'acme-law' },
    update: {},
    create: {
      slug: 'acme-law',
      name: 'Acme Law',
      ownerEmail: 'owner@acme-law.test',
      status: 'active',
      adminUsers: {
        create: [{ email: 'owner@acme-law.test', name: 'Acme Owner', password: hashed, role: 'owner' }],
      },
      siteSettings: {
        create: [{ key: 'brand_config', value: JSON.stringify({ logo_text: 'AC', firm_name: 'Acme Law', firm_full_name: 'Acme Law Associates' }) }],
      },
    },
  })
  console.log('Tenant:', tenant.slug)
  console.log('Owner email: owner@acme-law.test')
  console.log('Owner password:', password)
}

main().finally(() => prisma.$disconnect())
