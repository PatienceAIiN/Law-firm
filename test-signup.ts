import { requestSignupOtp, verifySignupOtp } from './src/app/signup/actions'

async function run() {
  const fd = new FormData()
  fd.append('name', 'Test User')
  fd.append('firmName', 'Test Firm')
  fd.append('email', 'test2@example.com')
  fd.append('slug', 'test-firm-2')

  try {
    const res: any = await requestSignupOtp(fd)
    console.log('OTP Res:', res)
    if (res.ok) {
      const vRes = await verifySignupOtp('test2@example.com', res.devOtp || '123456') // Note: if devOtp is missing it will fail with "Incorrect code" but NOT throw
      console.log('Verify Res:', vRes)
    }
  } catch (err) {
    console.error("ERROR CAUGHT:", err)
  }
}

run()
