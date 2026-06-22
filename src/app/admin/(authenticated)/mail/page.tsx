import { MailClient } from './mail-client'

export const dynamic = 'force-dynamic'

export default function MailPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="mb-5">
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-[#14203E]">Mail</h1>
        <p className="text-sm text-gray-500 mt-1">Connect your Gmail to read, send and manage email without leaving the portal.</p>
      </div>
      <MailClient />
    </div>
  )
}
