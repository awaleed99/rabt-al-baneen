'use client'

import Link from 'next/link'
import { MapPin, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar-custom'
import { Badge } from '@/components/ui/badge-custom'
import { formatDate, formatRelative, isOverdue, calculateAge, getOverdueDays, cn } from '@/lib/utils'
import type { Boy } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/context'

interface BoyCardProps {
  boy: Boy
}

export function BoyCard({ boy }: BoyCardProps) {
  const { t, language } = useLanguage()
  const overdue = isOverdue(boy.last_check_in, getOverdueDays())
  const age = calculateAge(boy.date_of_birth)

  return (
    <Link href={`/boys/${boy.id}`}>
      <div className={cn(
        'group bg-card border border-border rounded-xl p-5 card-hover cursor-pointer animate-fade-in transition-all',
        overdue && 'border-amber-400/50 dark:border-amber-500/40 shadow-xs'
      )}>
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar name={boy.full_name} imageUrl={boy.profile_image_url} size="lg" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors text-base">
              {boy.full_name}
            </h3>
            {age !== null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {age} {language === 'ar' ? t('years') : t('years')}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border',
                boy.kg_level === 'kg2'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30'
              )}>
                {boy.kg_level === 'kg2' ? 'KG2' : 'KG1'}
              </span>
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
      </div>
    </Link>
  )
}
