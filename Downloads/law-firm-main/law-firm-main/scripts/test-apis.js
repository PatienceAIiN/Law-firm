#!/usr/bin/env node

/**
 * API Testing Script
 * Tests all law firm case management APIs
 * Usage: node scripts/test-apis.js [baseUrl] [adminEmail] [adminPassword]
 */

const fetcher = require('node-fetch')

const BASE_URL = process.argv[2] || 'http://localhost:3000'
const ADMIN_EMAIL = process.argv[3] || 'admin@lawfirm.com'
const ADMIN_PASSWORD = process.argv[4] || 'admin123'

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
}

let adminToken = null
let testCaseId = null
let advocateId = null

async function fetch(url, options = {}) {
  const response = await fetcher(url, options)
  const data = await response.json()
  return { status: response.status, data }
}

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString()
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    test: `${colors.yellow}»${colors.reset}`
  }[type] || prefix.info

  console.log(`${prefix} [${timestamp}] ${message}`)
}

async function testAdminLogin() {
  log('Testing Admin Login...', 'test')

  try {
    const { status, data } = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    })

    if (status === 200 && data.token) {
      adminToken = data.token
      log('Admin login successful', 'success')
      return true
    } else {
      log('Admin login failed: ' + JSON.stringify(data), 'error')
      return false
    }
  } catch (error) {
    log('Admin login error: ' + error.message, 'error')
    return false
  }
}

async function testCreateCase() {
  log('Testing Create Case...', 'test')

  try {
    const caseData = {
      caseNumber: `TEST-${Date.now()}`,
      title: 'Test Case - ' + new Date().toLocaleDateString(),
      caseType: 'Civil',
      court: 'District High Court',
      clientName: 'Test Client',
      clientEmail: 'testclient@example.com',
      description: 'Test case for API validation'
    }

    const { status, data } = await fetch(`${BASE_URL}/api/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(caseData)
    })

    if (status === 201 && data.id) {
      testCaseId = data.id
      log(`Case created: ${data.caseNumber}`, 'success')
      return true
    } else {
      log('Create case failed: ' + JSON.stringify(data), 'error')
      return false
    }
  } catch (error) {
    log('Create case error: ' + error.message, 'error')
    return false
  }
}

async function testListCases() {
  log('Testing List Cases...', 'test')

  try {
    const { status, data } = await fetch(`${BASE_URL}/api/cases?limit=10&offset=0`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    })

    if (status === 200 && Array.isArray(data.cases)) {
      log(`Found ${data.cases.length} cases`, 'success')
      return true
    } else {
      log('List cases failed', 'error')
      return false
    }
  } catch (error) {
    log('List cases error: ' + error.message, 'error')
    return false
  }
}

async function testGetCaseDetails() {
  if (!testCaseId) {
    log('Skipping Get Case Details (no test case ID)', 'info')
    return false
  }

  log('Testing Get Case Details...', 'test')

  try {
    const { status, data } = await fetch(`${BASE_URL}/api/cases/${testCaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    })

    if (status === 200 && data.id) {
      log(`Case details retrieved: ${data.caseNumber}`, 'success')
      return true
    } else {
      log('Get case details failed', 'error')
      return false
    }
  } catch (error) {
    log('Get case details error: ' + error.message, 'error')
    return false
  }
}

async function testCreateAdvocate() {
  log('Testing Create Advocate...', 'test')

  try {
    const advocateData = {
      email: `advocate-${Date.now()}@lawfirm.com`,
      name: 'Test Advocate',
      password: 'SecurePass123!',
      title: 'Senior Advocate',
      expertise: 'Civil Law'
    }

    const { status, data } = await fetch(`${BASE_URL}/api/advocates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(advocateData)
    })

    if (status === 201 && data.id) {
      advocateId = data.id
      log(`Advocate created: ${data.email}`, 'success')
      return true
    } else {
      log('Create advocate failed: ' + JSON.stringify(data), 'error')
      return false
    }
  } catch (error) {
    log('Create advocate error: ' + error.message, 'error')
    return false
  }
}

async function testListAdvocates() {
  log('Testing List Advocates...', 'test')

  try {
    const { status, data } = await fetch(`${BASE_URL}/api/advocates`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    })

    if (status === 200 && Array.isArray(data.advocates)) {
      log(`Found ${data.advocates.length} advocates`, 'success')
      return true
    } else {
      log('List advocates failed', 'error')
      return false
    }
  } catch (error) {
    log('List advocates error: ' + error.message, 'error')
    return false
  }
}

async function testAddPayment() {
  if (!testCaseId) {
    log('Skipping Add Payment (no test case ID)', 'info')
    return false
  }

  log('Testing Add Payment...', 'test')

  try {
    const paymentData = {
      amount: 50000,
      mode: 'NEFT',
      reference: `REF-${Date.now()}`,
      description: 'Test payment',
      paymentDate: new Date().toISOString().split('T')[0]
    }

    const { status, data } = await fetch(`${BASE_URL}/api/cases/${testCaseId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(paymentData)
    })

    if (status === 201 && data.id) {
      log(`Payment added: ₹${data.amount}`, 'success')
      return true
    } else {
      log('Add payment failed: ' + JSON.stringify(data), 'error')
      return false
    }
  } catch (error) {
    log('Add payment error: ' + error.message, 'error')
    return false
  }
}

async function runAllTests() {
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`)
  console.log(`  Law Firm API Test Suite`)
  console.log(`  Base URL: ${BASE_URL}`)
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`)

  const tests = [
    { name: 'Admin Login', fn: testAdminLogin },
    { name: 'Create Case', fn: testCreateCase },
    { name: 'List Cases', fn: testListCases },
    { name: 'Get Case Details', fn: testGetCaseDetails },
    { name: 'Create Advocate', fn: testCreateAdvocate },
    { name: 'List Advocates', fn: testListAdvocates },
    { name: 'Add Payment', fn: testAddPayment }
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    const result = await test.fn()
    if (result) passed++
    else failed++
  }

  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`)
  console.log(`${colors.green}✓ Passed: ${passed}${colors.reset} | ${colors.red}✗ Failed: ${failed}${colors.reset}`)
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`)

  if (failed === 0) {
    log('All tests passed! System is ready for production.', 'success')
    process.exit(0)
  } else {
    log(`${failed} test(s) failed. Please check the configuration.`, 'error')
    process.exit(1)
  }
}

runAllTests().catch(error => {
  log('Test suite error: ' + error.message, 'error')
  process.exit(1)
})
