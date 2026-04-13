import Link from 'next/link'
import { Plus, FileText, Calendar, Mail, Settings, Users, MonitorPlay } from 'lucide-react'

export function QuickActions() {
  const actions = [
    {
      title: 'New Blog Post',
      description: 'Create a new blog post',
      icon: FileText,
      href: '/admin/blog/new',
      color: 'bg-purple-100 text-purple-600 hover:bg-purple-200'
    },
    {
      title: 'Manage Bookings',
      description: 'View consultation bookings',
      icon: Calendar,
      href: '/admin/availability',
      color: 'bg-blue-100 text-blue-600 hover:bg-blue-200'
    },
    {
      title: 'Virtual Meetings',
      description: 'Launch and record sessions',
      icon: MonitorPlay,
      href: '/admin/virtual-meetings',
      color: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
    },
    {
      title: 'Contact Inquiries',
      description: 'Review new messages',
      icon: Mail,
      href: '/admin/inbox',
      color: 'bg-green-100 text-green-600 hover:bg-green-200'
    },
    {
      title: 'Team Members',
      description: 'Manage team profiles',
      icon: Users,
      href: '/admin/profile',
      color: 'bg-orange-100 text-orange-600 hover:bg-orange-200'
    },
    {
      title: 'Site Settings',
      description: 'Configure website settings',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
      
      <div className="space-y-3">
        {actions.map((action, index) => (
          <Link key={index} href={action.href} className="block group">
            <div className={`flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${action.color}`}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <action.icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors duration-200">
                  {action.title}
                </h3>
                <p className="text-xs text-gray-600">
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <Link 
            href="/admin/help" 
            className="text-sm text-navy-600 hover:text-navy-700 font-medium"
          >
            Need help? View documentation
          </Link>
        </div>
      </div>
    </div>
  )
}
