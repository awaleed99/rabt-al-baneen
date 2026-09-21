import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getMonthlyAttendance } from '@/lib/actions/attendance'
import { AttendanceClient } from '@/components/attendance/attendance-client'
import type { Metadata } from 'next'
import type { Profile } from '@/lib/types'

export const metadata: Metadata = {
  title: 'كشف حضور الجمعة شهرياً | Friday Attendance',
  description: 'تسجيل ومتابعة حضور أولاد أسرة الأبرار حضانة كل يوم جمعة شهرياً',
}

async function AttendancePageContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1

  const initialData = await getMonthlyAttendance(year, month, 'all')

  return (
    <AttendanceClient
      initialData={initialData}
      isAdmin={profile?.role === 'admin'}
    />
  )
}

export default function AttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse" dir="rtl">
          <div className="h-10 w-72 bg-muted rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-muted rounded-2xl" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded-2xl" />
        </div>
      }
    >
      <AttendancePageContent />
    </Suspense>
  )
}
