import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()
async function main() {
  const password = await bcrypt.hash('lawyer@123', 10)
  const a = await prisma.advocate.upsert({
    where: { email: 'lawyer@lawfirm.com' },
    update: { password, isActive: true },
    create: {
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
