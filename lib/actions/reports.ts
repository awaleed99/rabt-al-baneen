'use server'

import { createClient } from '@/lib/supabase/server'
import { getMonthlyAttendance } from '@/lib/actions/attendance'
import { getCareDashboardData } from '@/lib/actions/care'
import { getMonthBirthdaysData } from '@/lib/actions/birthdays'
import { ARABIC_MONTHS, ENGLISH_MONTHS } from '@/lib/attendance-utils'
import type { PriestMonthlyReportData, CheckIn, Boy } from '@/lib/types'

/**
 * Gathers complete monthly executive report for Abouna / Ministry Leader
 */
export async function getPriestMonthlyReport(
  year: number,
  month: number
): Promise<PriestMonthlyReportData> {
  const supabase = await createClient()

  // 1. Fetch monthly attendance
  const attendanceData = await getMonthlyAttendance(year, month, 'all')

  // 2. Extract perfect attendance boys (100% attendance in month)
  const perfectAttendanceBoys: Boy[] = []
  for (const row of attendanceData.rows) {
    if (attendanceData.fridays.length > 0 && row.presentCount === attendanceData.fridays.length) {
      perfectAttendanceBoys.push(row.boy)
    }
  }

  // 3. Fetch care data for urgent pastoral alerts
  const careData = await getCareDashboardData()
  const urgentCareBoys = careData.urgentAlerts

  // 4. Query check-ins of the requested month
  const daysInMonth = new Date(year, month, 0).getDate()
  const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}T23:59:59.999Z`

  let totalVisits = 0
  let callCount = 0
  let homeCount = 0
  let churchCount = 0
  let healthCount = 0
  let generalCount = 0
  let recentVisits: (CheckIn & { boy?: Pick<Boy, 'id' | 'full_name'> })[] = []

  try {
    const { data: checkIns } = await supabase
      .from('check_ins')
      .select('id, boy_id, created_by, visit_date, notes, created_at, boy:boys(id, full_name)')
      .gte('visit_date', startDate)
      .lte('visit_date', endDate)
      .order('visit_date', { ascending: false })

    if (checkIns) {
      // Filter out pure internal attendance markers
      const pastoralCheckIns = checkIns.filter(c => !c.notes?.startsWith('[ATTENDANCE:'))
      totalVisits = pastoralCheckIns.length

      for (const c of pastoralCheckIns) {
        const notes = c.notes || ''
        if (notes.includes('[TYPE:call]')) callCount++
        else if (notes.includes('[TYPE:home]')) homeCount++
        else if (notes.includes('[TYPE:church]')) churchCount++
        else if (notes.includes('[TYPE:health]')) healthCount++
        else generalCount++
      }

      recentVisits = pastoralCheckIns.slice(0, 15) as any
    }
  } catch (err) {
    console.warn('Check-ins query warning in report:', err)
  }

  // 5. Fetch birthdays occurring in this month
  const birthdaysData = await getMonthBirthdaysData(month, year)

  return {
    year,
    month,
    monthNameAr: ARABIC_MONTHS[month - 1] || '',
    monthNameEn: ENGLISH_MONTHS[month - 1] || '',
    totalBoysCount: attendanceData.stats.totalBoys,
    overallAttendanceRate: attendanceData.stats.overallAttendanceRate,
    perfectAttendanceBoys,
    urgentCareBoys,
    visitationsSummary: {
      totalVisits,
      callCount,
      homeCount,
      churchCount,
      healthCount,
      generalCount,
    },
    recentVisits,
    birthdaysThisMonth: birthdaysData.boys,
    generatedAt: new Date().toISOString(),
  }
}
