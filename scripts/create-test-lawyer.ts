import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()
async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'acme-law' } })
  if (!tenant) throw new Error('Create acme-law tenant first')
  const hashed = await bcrypt.hash('Lawyer123!', 10)
  const a = await prisma.advocate.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'lawyer@acme-law.test' } },
    update: { password: hashed, isActive: true },
    create: { tenantId: tenant.id, name: 'Acme Lawyer', email: 'lawyer@acme-law.test', password: hashed, title: 'Senior Advocate', isActive: true },
  })
  console.log('Lawyer ready in tenant acme-law:', a.email, '/ password: Lawyer123!')
}
main().finally(() => prisma.$disconnect())
