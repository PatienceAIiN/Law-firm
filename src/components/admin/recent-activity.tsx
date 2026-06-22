"use client"

import { useState } from 'react'
import { Calendar, Mail, FileText, Users, Clock, ArrowRight } from 'lucide-react'
import { AdminDialog } from './admin-dialog'

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: 'booking',
      title: 'New consultation booking',
      description: 'Rajesh Kumar booked a consultation for Corporate Law',
      time: '2 hours ago',
      icon: Calendar,
      detail: 'Booking request ready for review in the availability calendar.'
    },
    {
      id: 2,
      type: 'inquiry',
      title: 'New contact inquiry',
      description: 'Priya Sharma sent a message about family law services',
      time: '4 hours ago',
      icon: Mail,
      detail: 'Incoming inquiry waiting in the inbox.'
    },
    {
      id: 3,
      type: 'blog',
      title: 'Blog post published',
      description: 'Understanding Corporate Governance was published',
      time: '1 day ago',
      icon: FileText,
      detail: 'Published article is now visible on the public blog.'
    },
    {
      id: 4,
      type: 'user',
      title: 'New user registration',
      description: 'Amit Patel created an account on the website',
      time: '2 days ago',
      icon: Users,
      detail: 'New profile activity recorded in the system.'
    }
  ]
  const [selectedActivity, setSelectedActivity] = useState<(typeof activities)[number] | null>(null)

  const getIconColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-100 text-blue-600'
      case 'inquiry':
        return 'bg-green-100 text-green-600'
      case 'blog':
        return 'bg-purple-100 text-purple-600'
      case 'user':
        return 'bg-orange-100 text-orange-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        <button onClick={() => setSelectedActivity(activities[0])} className="text-sm text-navy-600 hover:text-navy-700 font-medium">
          View details
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <button key={activity.id} onClick={() => setSelectedActivity(activity)} className="block group w-full text-left">
            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getIconColor(activity.type)}`}>
                <activity.icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-navy-600 transition-colors duration-200">
                    {activity.title}
                  </h3>
                  <div className="flex items-center text-xs text-gray-500 ml-2">
                    <Clock className="w-3 h-3 mr-1" />
                    {activity.time}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <button onClick={() => setSelectedActivity(activities[0])} className="text-sm text-navy-600 hover:text-navy-700 font-medium">
            View all activity
          </button>
        </div>
      </div>

      <AdminDialog
        isOpen={Boolean(selectedActivity)}
        onClose={() => setSelectedActivity(null)}
        title={selectedActivity?.title || 'Activity Detail'}
        description={selectedActivity?.time || ''}
      >
        {selectedActivity && (
          <div className="space-y-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${getIconColor(selectedActivity.type)}`}>
              <selectedActivity.icon className="w-8 h-8" />
            </div>
            <p className="text-gray-600">{selectedActivity.description}</p>
            <p className="text-sm font-medium text-gray-500">{selectedActivity.detail}</p>
            <div className="flex gap-3">
              <a href="/admin/virtual-meetings" className="inline-flex items-center gap-2 rounded-2xl bg-[#14203E] px-4 py-3 text-white text-xs font-black uppercase tracking-widest">
                Open Meeting Hub
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href="/admin/inbox" className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-[#14203E] text-xs font-black uppercase tracking-widest">
                Open Inbox
              </a>
            </div>
          </div>
        )}
      </AdminDialog>
    </div>
  )
}
