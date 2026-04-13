#!/usr/bin/env node

/**
 * Create Admin User Script
 * Usage: node scripts/create-admin.js --email admin@example.com --password "SecurePass123!"
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer))
  })
}

async function createAdmin() {
  console.log('\n🔐 Create Admin User for Law Firm Case Management\n')

  try {
    // Get email
    let email = process.argv.find(arg => arg.startsWith('--email='))?.split('=')[1]
    if (!email) {
      email = await question('📧 Admin Email: ')
    }

    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email format')
      process.exit(1)
    }

    // Check if exists
    const existing = await prisma.adminUser.findUnique({ where: { email } })
    if (existing) {
      console.error(`❌ Admin with email ${email} already exists`)
      process.exit(1)
    }

    // Get password
    let password = process.argv.find(arg => arg.startsWith('--password='))?.split('=')[1]
    if (!password) {
      password = await question('🔒 Admin Password (min 8 chars): ')
    }

    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters')
      process.exit(1)
    }

    // Get name
    let name = process.argv.find(arg => arg.startsWith('--name='))?.split('=')[1]
    if (!name) {
      name = await question('👤 Admin Name: ')
    }

    if (!name) {
      name = 'Administrator'
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin
    const admin = await prisma.adminUser.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'admin',
        isPasswordResetNeeded: false
      }
    })

    console.log('\n✅ Admin user created successfully!')
    console.log(`
📋 Admin Details:
   Email: ${email}
   Name: ${name}
   Role: admin
   
🔐 Login at: /admin/login
    `)

    rl.close()
  } catch (error) {
    console.error('❌ Error creating admin:', error.message)
    rl.close()
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
