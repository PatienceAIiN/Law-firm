import type { ClientEmailTemplateType } from './email'

export const CLIENT_EMAIL_TEMPLATE_OPTIONS: Array<{
  value: ClientEmailTemplateType
  label: string
}> = [
  { value: 'booking_confirmation', label: 'Booking Confirmation' },
  { value: 'consultation_reminder', label: 'Consultation Reminder' },
  { value: 'follow_up', label: 'Follow-up Note' },
]
