'use client'

import { Users, CalendarCheck, AlertCircle, TrendingUp, Clock, Plus } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar-custom'
import { Button } from '@/components/ui/button-custom'
import { formatRelative, formatDateTime, getOverdueDays } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/context'
import Link from 'next/link'
import type { DashboardStats, Profile } from '@/lib/types'

interface DashboardClientProps {
  stats: DashboardStats
  profile: Profile | null
}

export function DashboardClient({ stats, profile }: DashboardClientProps) {
  const { t, language, isRTL } = useLanguage()
  const overdueDays = getOverdueDays()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('greeting_morning') : hour < 17 ? t('greeting_afternoon') : t('greeting_evening')

  const cards = [
    {
      label: t('stat_total_boys'),
      value: stats.totalBoys,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
      sub: t('stat_total_boys_sub'),
    },
    {
      label: t('stat_total_visits'),
      value: stats.totalCheckIns,
      icon: CalendarCheck,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      sub: t('stat_total_visits_sub'),
    },
    {
      label: t('stat_recent_visits'),
      value: stats.recentCheckIns,
      icon: TrendingUp,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      sub: t('stat_recent_visits_sub'),
    },
    {
      label: t('stat_overdue'),
      value: stats.overdueCount,
      icon: AlertCircle,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      sub: `${t('stat_overdue_sub')} ${overdueDays} ${t('days')}`,
    },
  ]

  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : (language === 'ar' ? 'أخي الكريم' : 'there')

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {greeting}، {firstName} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('dashboard_welcome_sub')}</p>
        </div>
        {profile?.role === 'admin' && (
          <Link href="/boys/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>
              {t('nav_add_boy')}
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-2xl p-6 card-hover shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-muted-foreground">{card.label}</span>
              <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center shadow-xs`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">{t('recent_activity')}</h2>
          <Link href="/boys" className="text-sm font-semibold text-primary hover:underline">
            {t('view_all_boys')} {isRTL ? '←' : '→'}
          </Link>
        </div>

        {stats.recentCheckInsList.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 opacity-30 text-primary" />
            </div>
            <p className="font-semibold text-foreground">{t('no_recent_activity')}</p>
            <p className="text-sm mt-1">{t('no_recent_activity_sub')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentCheckInsList.map((ci) => (
              <Link
                key={ci.id}
                href={`/boys/${ci.boy_id}`}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/40 transition-all group border border-transparent hover:border-border"
              >
                <Avatar
                  name={ci.boy?.full_name ?? 'Unknown'}
                  imageUrl={ci.boy?.profile_image_url}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {ci.boy?.full_name ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('visited_by')} {ci.creator?.full_name ?? 'Unknown'} · {formatRelative(ci.visit_date)}
                  </p>
                  {ci.notes && (
                    <p className="text-xs text-muted-foreground truncate mt-1 bg-muted/40 px-2 py-1 rounded">
                      {ci.notes}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                  {formatDateTime(ci.visit_date)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
