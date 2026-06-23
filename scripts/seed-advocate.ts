import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()
async function main() {
  const password = await bcrypt.hash('lawyer@123', 10)
  const existing = await prisma.advocate.findFirst({
    where: { email: 'lawyer@lawfirm.com', tenantId: null }
  })
  const a = existing
    ? await prisma.advocate.update({
        where: { id: existing.id },
        data: { password, isActive: true },
      })
    : await prisma.advocate.create({
        data: {
          email: 'lawyer@lawfirm.com',
          password,
          name: 'Senior Advocate',
          title: 'Senior Advocate',
          isActive: true,
        },
      })
  console.log('Advocate ready:', a.email, '/ password: lawyer@123')
}
main().finally(() => prisma.$disconnect())
