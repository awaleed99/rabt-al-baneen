import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, differenceInDays, differenceInYears } from 'date-fns'
import { arSA } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function getLocale() {
  if (typeof document !== 'undefined') {
    return document.documentElement.lang === 'en' ? undefined : arSA
  }
  return arSA
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'd MMMM yyyy', { locale: getLocale() })
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'd MMM yyyy · h:mm a', { locale: getLocale() })
}

export function formatRelative(date: string | null | undefined): string {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: getLocale() })
}

export function calculateAge(dob: string | null | undefined): number | null {
  if (!dob) return null
  return differenceInYears(new Date(), new Date(dob))
}

export function isOverdue(lastCheckIn: string | null | undefined, days = 30): boolean {
  if (!lastCheckIn) return true
  return differenceInDays(new Date(), new Date(lastCheckIn)) > days
}

export function getDaysSince(date: string | null | undefined): number | null {
  if (!date) return null
  return differenceInDays(new Date(), new Date(date))
}

export function getOverdueDays(): number {
  const envVal = process.env.NEXT_PUBLIC_OVERDUE_DAYS
  const parsed = envVal ? parseInt(envVal, 10) : NaN
  return isNaN(parsed) ? 30 : parsed
}

export function truncateText(text: string, length = 80): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '…'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
