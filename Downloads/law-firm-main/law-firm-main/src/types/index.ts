export type BlogStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type MeetingMode = 'PHYSICAL' | 'GOOGLE_MEET' | 'ZOOM'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  coverImage?: string
  status: BlogStatus
  seoTitle?: string
  seoDescription?: string
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface AboutProfile {
  id: string
  name: string
  title: string
  aboutContent: string
  profileImage?: string
  practiceAreas: string[]
  socialLinks?: Record<string, string>
  officeDetails?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface ContactSubmission {
  id: string
  fullName: string
  email: string
  phone?: string
  subject: string
  message: string
  serviceType?: string
  createdAt: Date
}

export interface AvailabilitySlot {
  id: string
  dayId: string
  startTime: Date
  endTime: Date
  capacity: number
  bookedCount: number
  isActive: boolean
  allowedModes: MeetingMode[]
  manualMeetingLink?: string
  physicalAddress?: string
  createdAt: Date
  updatedAt: Date
}

export interface ConsultationBooking {
  id: string
  slotId: string
  name: string
  email: string
  phone: string
  subject: string
  notes?: string
  meetingMode: MeetingMode
  meetingLink?: string
  status: BookingStatus
  createdAt: Date
  updatedAt: Date
  slot: AvailabilitySlot
}

export interface SiteSetting {
  id: string
  key: string
  value: any
  createdAt: Date
  updatedAt: Date
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  createdAt: Date
  updatedAt: Date
}

export interface BookingFormData {
  name: string
  email: string
  phone: string
  subject: string
  notes?: string
  meetingMode: MeetingMode
  slotId: string
}

export interface ContactFormData {
  fullName: string
  email: string
  phone?: string
  subject: string
  message: string
  serviceType?: string
}

export interface BlogFormData {
  title: string
  slug: string
  excerpt?: string
  content: string
  coverImage?: string
  status: BlogStatus
  seoTitle?: string
  seoDescription?: string
  publishedAt?: Date
}

export interface AboutFormData {
  name: string
  title: string
  aboutContent: string
  profileImage?: string
  practiceAreas: string[]
  socialLinks: Record<string, string>
  officeDetails: Record<string, any>
}
