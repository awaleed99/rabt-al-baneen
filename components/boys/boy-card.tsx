'use client'

import { useRouter } from 'next/navigation'
import { MapPin, Calendar, Clock, CheckCircle2, AlertCircle, Phone, MessageCircle } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar-custom'
import { Badge } from '@/components/ui/badge-custom'
import { formatDate, formatRelative, isOverdue, calculateAge, getOverdueDays, cn } from '@/lib/utils'
import { isTodayBirthday, getTurningAge, cleanPhoneNumber } from '@/lib/birthday'
import type { Boy } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/context'

interface BoyCardProps {
  boy: Boy
}

export function BoyCard({ boy }: BoyCardProps) {
  const router = useRouter()
  const { t, language } = useLanguage()
  const overdue = isOverdue(boy.last_check_in, getOverdueDays())
  const age = calculateAge(boy.date_of_birth)
  const isBirthday = isTodayBirthday(boy.date_of_birth)
  const turningAge = getTurningAge(boy.date_of_birth)

  const fatherPhone = boy.father_phone || boy.phone_number
  const motherPhone = boy.mother_phone

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/boys/${boy.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/boys/${boy.id}`)
        }
      }}
      className={cn(
          'group bg-card border border-border rounded-xl p-5 card-hover cursor-pointer animate-fade-in transition-all relative overflow-hidden',
          overdue && 'border-amber-400/50 dark:border-amber-500/40 shadow-xs',
          isBirthday && 'border-amber-400 ring-2 ring-amber-400/30 bg-gradient-to-br from-amber-500/5 via-card to-pink-500/5 shadow-md shadow-amber-500/10'
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar
            name={boy.full_name}
            imageUrl={boy.profile_image_url}
            size="lg"
            hasBirthdayHat={isBirthday}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors text-base">
                {boy.full_name}
              </h3>
              {isBirthday && (
                <span className="text-lg select-none shrink-0" title="عيد ميلاد سعيد! 🎉">
                  🎂
                </span>
              )}
            </div>

            {age !== null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {age} {language === 'ar' ? t('years') : t('years')}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border',
                  boy.kg_level === 'kg2'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30'
                )}
              >
                {boy.kg_level === 'kg2' ? 'KG2' : 'KG1'}
              </span>

              {isBirthday && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 animate-pulse">
                  <span>🎉</span>
                  <span>{language === 'ar' ? `عيد ميلاده اليوم! (${turningAge} سنة)` : `Birthday Today! (${turningAge}y)`}</span>
                </span>
              )}

              {overdue ? (
                <Badge variant="warning">
                  <AlertCircle className="w-3 h-3 me-1" />
                  {t('badge_overdue')}
                </Badge>
              ) : (
                <Badge variant="success">
                  <CheckCircle2 className="w-3 h-3 me-1" />
                  {t('badge_recent')}
                </Badge>
              )}

              <Badge variant="outline">
                {boy.check_in_count ?? 0} {language === 'ar' ? 'زيارات' : 'visits'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 pt-1 border-t border-border/60">
          {boy.address && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-primary/70" />
              <span className="truncate">{boy.address}</span>
            </div>
          )}
          {boy.date_of_birth && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-primary/70" />
              <span>{formatDate(boy.date_of_birth)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 shrink-0 text-primary/70" />
            <span>
              {boy.last_check_in
                ? `${t('last_visit')}: ${formatRelative(boy.last_check_in)}`
                : t('never_visited')}
            </span>
          </div>
        </div>

        {/* Parent Contacts Quick Bar */}
        {(fatherPhone || motherPhone) && (
          <div
            className="flex items-center gap-2 pt-2.5 mt-2 border-t border-border/60 flex-wrap"
            onClick={(e) => {
              // Prevent triggering card link navigation when clicking telephone/whatsapp buttons
              e.stopPropagation()
            }}
          >
            {fatherPhone && (
              <div className="inline-flex items-center gap-1.5 text-xs bg-muted/60 hover:bg-muted/90 px-2.5 py-1 rounded-lg border border-border/60 transition-colors">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <span>👨</span>
                  <span>{language === 'ar' ? 'الأب' : 'Father'}:</span>
                </span>
                <a
                  href={`tel:${fatherPhone}`}
                  className="text-primary hover:underline font-mono text-[11px]"
                  title={language === 'ar' ? 'اتصال هاتفياً' : 'Call'}
                  onClick={(e) => e.stopPropagation()}
                >
                  {fatherPhone}
                </a>
                <a
                  href={`https://wa.me/${cleanPhoneNumber(fatherPhone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-500 p-0.5 rounded transition-transform hover:scale-110"
                  title="WhatsApp"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {motherPhone && (
              <div className="inline-flex items-center gap-1.5 text-xs bg-muted/60 hover:bg-muted/90 px-2.5 py-1 rounded-lg border border-border/60 transition-colors">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <span>👩</span>
                  <span>{language === 'ar' ? 'الأم' : 'Mother'}:</span>
                </span>
                <a
                  href={`tel:${motherPhone}`}
                  className="text-primary hover:underline font-mono text-[11px]"
                  title={language === 'ar' ? 'اتصال هاتفياً' : 'Call'}
                  onClick={(e) => e.stopPropagation()}
                >
                  {motherPhone}
                </a>
                <a
                  href={`https://wa.me/${cleanPhoneNumber(motherPhone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-500 p-0.5 rounded transition-transform hover:scale-110"
                  title="WhatsApp"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
  )
}
