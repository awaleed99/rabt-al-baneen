import type { Boy } from '@/lib/types'

/**
 * Checks if the given date of birth is today (same month and day)
 */
export function isTodayBirthday(dateOfBirth: string | null | undefined): boolean {
  if (!dateOfBirth) return false
  try {
    const today = new Date()
    const parts = dateOfBirth.split('-')
    if (parts.length < 3) return false

    const birthMonth = parseInt(parts[1], 10)
    const birthDay = parseInt(parts[2], 10)

    return today.getMonth() + 1 === birthMonth && today.getDate() === birthDay
  } catch {
    return false
  }
}

/**
 * Checks if the birthday is in the next 7 days
 */
export function isBirthdayThisWeek(dateOfBirth: string | null | undefined): boolean {
  if (!dateOfBirth) return false
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const parts = dateOfBirth.split('-')
    if (parts.length < 3) return false

    const birthMonth = parseInt(parts[1], 10) - 1
    const birthDay = parseInt(parts[2], 10)

    // Current year birthday
    let thisYearBirthday = new Date(today.getFullYear(), birthMonth, birthDay)
    if (thisYearBirthday < today) {
      // If already passed earlier this year, check next year (e.g., end of Dec to Jan)
      thisYearBirthday = new Date(today.getFullYear() + 1, birthMonth, birthDay)
    }

    const diffDays = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 7
  } catch {
    return false
  }
}

/**
 * Calculates the age the child turns on this birthday
 */
export function getTurningAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null
  try {
    const birthYear = parseInt(dateOfBirth.split('-')[0], 10)
    const currentYear = new Date().getFullYear()
    const age = currentYear - birthYear
    return age > 0 ? age : null
  } catch {
    return null
  }
}

/**
 * Normalizes phone number to international format (for Egypt: 01xxxxxxxxx -> 201xxxxxxxxx)
 */
export function cleanPhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null
  // Remove non-digit chars
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null

  if (digits.startsWith('01') && digits.length === 11) {
    return `2${digits}`
  }
  if (digits.startsWith('201') && digits.length === 12) {
    return digits
  }
  return digits
}

/**
 * Generates direct WhatsApp greeting link for father or mother
 */
export function getWhatsAppGreetingUrl(
  phone: string | null | undefined,
  boyName: string,
  parentRole: 'father' | 'mother'
): string | null {
  const normalized = cleanPhoneNumber(phone)
  if (!normalized) return null

  const greetingTarget = parentRole === 'father' ? 'أستاذنا الحبيب ولي أمر' : 'أم البطل الغالية والدة'
  const message = `سلام ومحبة ونعمة من ربنا يسوع المسيح ✝️
كل سنة وحبيبنا البطل ${boyName} طيب وبألف خير بمناسبة عيد ميلاده المبارك! 🎉🎂🎈
نتمنى له عاماً سعيداً ممتلئاً بالبركة والنعمة والنمو في حضن الكنيسة ❤️
خالص محبتنا وصلواتنا 🤍
— فصل الأمير تادرس | كنيسة مارمرقس`

  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

/**
 * Filters boys whose birthday is today
 */
export function getTodayBirthdayBoys(boys: Boy[]): Boy[] {
  return boys.filter((b) => isTodayBirthday(b.date_of_birth))
}
