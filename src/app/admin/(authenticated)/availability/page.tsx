import { AvailabilityCalendar } from '@/components/admin/availability-calendar'
import { listAvailabilityForMonth, istDateKey } from '@/lib/consultation-scheduling'

export default async function AvailabilityPage() {
  const month = istDateKey(new Date()).slice(0, 7)
  const days = await listAvailabilityForMonth(month)

  return (
    <div className="p-8">
      <AvailabilityCalendar initialMonth={month} initialDays={days} />
    </div>
  )
}
