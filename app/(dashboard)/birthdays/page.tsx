import { Suspense } from 'react'
import { getMonthBirthdaysData } from '@/lib/actions/birthdays'
import { BirthdaysClient } from '@/components/birthdays/birthdays-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'أعياد ميلاد الطلبة الشهرية | Monthly Birthdays',
  description: 'استعراض ومتابعة أعياد ميلاد أطفال فصل الأمير تادرس شهراً بشهر مع إمكانية التهنئة المباشرة والطباعة',
}

async function BirthdaysPageContent() {
  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const initialData = await getMonthBirthdaysData(currentMonth, today.getFullYear())

  return <BirthdaysClient initialData={initialData} />
}

export default function BirthdaysPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse" dir="rtl">
          <div className="h-10 w-72 bg-muted rounded-xl" />
          <div className="h-28 bg-muted rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 bg-muted rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <BirthdaysPageContent />
    </Suspense>
  )
}
