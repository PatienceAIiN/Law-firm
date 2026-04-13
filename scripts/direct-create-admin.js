#!/usr/bin/env node

/**
 * Direct Admin Creation Script (Non-Interactive)
 * Creates an admin user directly via Prisma
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  const email = 'admin@testlawfirm.com'
  const password = 'TestPass123!'
  const name = 'Test Admin'

  try {
    // Check if user exists
    const existing = await prisma.adminUser.findUnique({
      where: { email }
    })

    if (existing) {
      console.log(`✓ Admin user already exists: ${email}`)
      process.exit(0)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin user
    const admin = await prisma.adminUser.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'ADMIN'
      }
    })

    console.log(`✓ Admin user created successfully!`)
    console.log(`  Email: ${admin.email}`)
    console.log(`  Name: ${admin.name}`)
    console.log(`  ID: ${admin.id}`)

  } catch (error) {
    console.error('✗ Error creating admin user:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
