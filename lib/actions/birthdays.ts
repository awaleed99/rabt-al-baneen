'use server'

import { getBoys } from '@/lib/actions/boys'
import { ARABIC_MONTHS, ENGLISH_MONTHS } from '@/lib/attendance-utils'
import { isTodayBirthday, getTurningAge } from '@/lib/birthday'
import type { BirthdayBoyInfo, MonthlyBirthdaysData } from '@/lib/types'

const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const ENGLISH_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Fetches all boys having their birthday in the requested month (1-12)
 */
export async function getMonthBirthdaysData(
  month: number,
  targetYear?: number
): Promise<MonthlyBirthdaysData> {
  const currentYear = targetYear || new Date().getFullYear()
  const boys = await getBoys('', 'full_name', 'asc', 'all')

  const monthBoys: BirthdayBoyInfo[] = []
  let kg1Count = 0
  let kg2Count = 0
  let todayCount = 0

  for (const boy of boys) {
    if (!boy.date_of_birth) continue

    const parts = boy.date_of_birth.split('-')
    if (parts.length < 3) continue

    const bMonth = parseInt(parts[1], 10)
    const bDay = parseInt(parts[2], 10)

    if (bMonth === month) {
      const turningAge = getTurningAge(boy.date_of_birth) || 0
      const isToday = isTodayBirthday(boy.date_of_birth)

      // Calculate the day of week when birthday falls in currentYear
      const birthdayDateThisYear = new Date(currentYear, month - 1, bDay)
      const dayOfWeekIndex = birthdayDateThisYear.getDay()

      const boyInfo: BirthdayBoyInfo = {
        ...boy,
        turningAge,
        birthDay: bDay,
        birthMonth: bMonth,
        dayNameAr: ARABIC_DAYS[dayOfWeekIndex],
        dayNameEn: ENGLISH_DAYS[dayOfWeekIndex],
        isToday,
      }

      monthBoys.push(boyInfo)

      if (boy.kg_level === 'kg1') kg1Count++
      if (boy.kg_level === 'kg2') kg2Count++
      if (isToday) todayCount++
    }
  }

  // Sort by day of month ascending
  monthBoys.sort((a, b) => a.birthDay - b.birthDay)

  return {
    year: currentYear,
    month,
    monthNameAr: ARABIC_MONTHS[month - 1] || '',
    monthNameEn: ENGLISH_MONTHS[month - 1] || '',
    boys: monthBoys,
    stats: {
      totalThisMonth: monthBoys.length,
      kg1Count,
      kg2Count,
      todayCount,
    },
  }
}
