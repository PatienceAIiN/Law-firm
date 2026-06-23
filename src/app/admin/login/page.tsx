import { Metadata } from 'next'
import { LoginForm } from '@/components/admin/login-form'
import { VideoCover, COVER_VIDEOS } from '@/components/video-cover'

export const metadata: Metadata = {
  title: 'Admin Login | Senior Advocate Law Firm',
  description: 'Secure admin login for law firm management system',
}

export default function AdminLoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FFFCF8] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <VideoCover src={COVER_VIDEOS.home} overlay="strong" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-[var(--primary)] rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">SA</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--primary)]">
          Admin Login
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--primary)]/70">
          Sign in to manage your law firm website
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/90 backdrop-blur-md py-8 px-4 shadow-xl ring-1 ring-black/5 sm:rounded-2xl sm:px-10">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
