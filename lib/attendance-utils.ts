import type { FridayInfo } from '@/lib/types'

export const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

export const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/**
 * Computes all Fridays for the given year and month (1-indexed month: 1=Jan, 9=Sep)
 */
export function getFridaysOfMonth(year: number, month: number): FridayInfo[] {
  const fridays: FridayInfo[] = []
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = new Date()
  const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day)
    // 5 = Friday in JS getDay()
    if (d.getDay() === 5) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const isToday = dateStr === todayDateStr
      const isPast = dateStr < todayDateStr

      fridays.push({
        date: dateStr,
        dayNumber: day,
        labelAr: `جمعة ${day} ${ARABIC_MONTHS[month - 1]}`,
        labelEn: `Fri ${day} ${ENGLISH_MONTHS[month - 1]}`,
        isToday,
        isPast,
      })
    }
  }

  return fridays
}
