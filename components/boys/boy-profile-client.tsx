'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  MapPin, Calendar, Phone, FileText, Edit, Trash2, Plus, CalendarCheck,
  ArrowLeft, ArrowRight, Clock, User2, GraduationCap, MessageCircle
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar-custom'
import { Badge } from '@/components/ui/badge-custom'
import { Button } from '@/components/ui/button-custom'
import { CheckInModal } from '@/components/boys/check-in-modal'
import { CheckInHistory } from '@/components/boys/check-in-history'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteBoy } from '@/lib/actions/boys'
import { getCheckIns } from '@/lib/actions/check-ins'
import {
  formatDate, formatRelative, calculateAge, isOverdue, getOverdueDays, cn
} from '@/lib/utils'
import { isTodayBirthday, getTurningAge, getWhatsAppGreetingUrl, cleanPhoneNumber } from '@/lib/birthday'
import type { Boy, CheckIn, Profile } from '@/lib/types'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/context'

interface BoyProfileClientProps {
  boy: Boy
  profile: Profile
  initialCheckIns: CheckIn[]
  checkInCount: number
}

const PAGE_SIZE = 10

export function BoyProfileClient({ boy: initialBoy, profile, initialCheckIns, checkInCount: initialCount }: BoyProfileClientProps) {
  const { t, language, isRTL } = useLanguage()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [boy, setBoy] = useState(initialBoy)
  const [checkIns, setCheckIns] = useState(initialCheckIns)
  const [checkInCount, setCheckInCount] = useState(initialCount)
  const [page, setPage] = useState(1)

  const isAdmin = profile.role === 'admin'
  const overdueDays = getOverdueDays()
  const overdue = isOverdue(boy.last_check_in, overdueDays)
  const age = calculateAge(boy.date_of_birth)
  const isBirthday = isTodayBirthday(boy.date_of_birth)
  const turningAge = getTurningAge(boy.date_of_birth)
  const fatherPhone = boy.father_phone || boy.phone_number
  const motherPhone = boy.mother_phone

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`boy-profile-${boy.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'check_ins',
        filter: `boy_id=eq.${boy.id}`
      }, () => { refreshCheckIns(page) })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [boy.id, page])

  async function refreshCheckIns(p = 1) {
    const { data, count } = await getCheckIns(boy.id, p, PAGE_SIZE)
    setCheckIns(data)
    setCheckInCount(count)
    setPage(p)
  }

  function handleDeleteBoy() {
    startTransition(async () => {
      const result = await deleteBoy(boy.id)
      if (!result.success) { toast.error(result.error); return }
      toast.success(language === 'ar' ? 'تم حذف الملف بنجاح.' : 'Boy profile deleted.')
      router.push('/boys')
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back link */}
      <Link href="/boys" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        <span>{language === 'ar' ? 'الرجوع إلى سجل البنين' : 'Back to Boys'}</span>
      </Link>

      {/* Birthday Celebration Hero Banner */}
      {isBirthday && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-pink-500/15 to-purple-500/20 border-2 border-amber-400/60 shadow-lg shadow-amber-500/10 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-4 text-center sm:text-right">
            <span className="text-4xl sm:text-5xl animate-bounce shrink-0 select-none">🎂</span>
            <div>
              <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <span>🎉 اليوم عيد ميلاد {boy.full_name}!</span>
                {turningAge && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-700 dark:text-amber-300 font-bold">
                    أتم اليوم {turningAge} سنوات 🎈
                  </span>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                نتمنى له عاماً مباركاً سعيداً ممتلئاً بالنعمة والبركة في حضن الكنيسة وأسرة الأبرار ❤️
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap justify-center shrink-0">
            {fatherPhone && (
              <a
                href={getWhatsAppGreetingUrl(fatherPhone, boy.full_name, 'father') || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
              >
                <MessageCircle className="w-4 h-4" />
                <span>تهنئة الأب واتساب 👨</span>
              </a>
            )}
            {motherPhone && (
              <a
                href={getWhatsAppGreetingUrl(motherPhone, boy.full_name, 'mother') || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
              >
                <MessageCircle className="w-4 h-4" />
                <span>تهنئة الأم واتساب 👩</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        {/* Cover gradient */}
        <div className="h-32 bg-gradient-to-r from-teal-600/30 via-primary/20 to-blue-600/10" />

        <div className="px-6 pb-6">
          <div className="flex flex-wrap items-end gap-4 -mt-12 mb-6">
            <Avatar
              name={boy.full_name}
              imageUrl={boy.profile_image_url}
              size="xl"
              className="ring-4 ring-card shadow-xl"
              hasBirthdayHat={isBirthday}
            />
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{boy.full_name}</h1>
                <span className={cn(
                  'inline-flex items-center px-3 py-1 rounded-lg text-xs sm:text-sm font-bold border shadow-xs',
                  boy.kg_level === 'kg2'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30'
                )}>
                  {boy.kg_level === 'kg2'
                    ? (language === 'ar' ? 'KG2 — المرحلة الثانية' : 'KG2 — Level 2')
                    : (language === 'ar' ? 'KG1 — المرحلة الأولى' : 'KG1 — Level 1')}
                </span>
                {overdue ? (
                  <Badge variant="warning">{t('badge_overdue')}</Badge>
                ) : (
                  <Badge variant="success">{t('badge_recent')}</Badge>
                )}
              </div>
              {age !== null && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {age} {language === 'ar' ? t('years') : t('years')}
                </p>
              )}
            </div>
            {/* Actions */}
            <div className="flex gap-2 pb-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setShowCheckInModal(true)}
              >
                {t('record_visit')}
              </Button>
              {isAdmin && (
                <>
                  <Link href={`/boys/${boy.id}/edit`}>
                    <Button variant="outline" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                      {t('edit')}
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    {t('delete')}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 p-4 bg-muted/40 rounded-xl">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5 text-primary" />
                <span>{t('stat_total_visits')}</span>
              </p>
              <p className="text-xl font-bold text-foreground">{boy.check_in_count ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{t('last_visit')}</span>
              </p>
              <p className="text-sm font-semibold text-foreground">
                {boy.last_check_in ? formatRelative(boy.last_check_in) : t('never_visited')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1.5">
                <User2 className="w-3.5 h-3.5 text-primary" />
                <span>{language === 'ar' ? 'سُجل بواسطة' : 'Added by'}</span>
              </p>
              <p className="text-sm font-semibold text-foreground truncate">
                {(boy as any).creator?.full_name ?? '—'}
              </p>
            </div>
          </div>

          {/* Detail fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('kg_level')}</p>
                <p className="text-sm font-bold text-foreground">
                  {boy.kg_level === 'kg2' ? 'KG2' : 'KG1'}
                </p>
              </div>
            </div>
            {boy.date_of_birth && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('date_of_birth')}</p>
                  <p className="text-sm font-medium text-foreground">{formatDate(boy.date_of_birth)}</p>
                </div>
              </div>
            )}
            {boy.address && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('address')}</p>
                  <p className="text-sm font-medium text-foreground">{boy.address}</p>
                </div>
              </div>
            )}

            {/* Parent Contacts Section */}
            <div className="sm:col-span-2 grid sm:grid-cols-2 gap-3 pt-2">
              {/* Father Card */}
              <div className="p-3.5 rounded-xl border border-border bg-card/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 text-base">
                    👨
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">
                      {language === 'ar' ? 'هاتف الأب / ولي الأمر' : "Father's Phone"}
                    </p>
                    <p className="text-sm font-bold text-foreground font-mono truncate" dir="ltr">
                      {fatherPhone || '—'}
                    </p>
                  </div>
                </div>
                {fatherPhone && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${fatherPhone}`}
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      title={language === 'ar' ? 'اتصال هاتفياً' : 'Call'}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <a
                      href={`https://wa.me/${cleanPhoneNumber(fatherPhone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>

              {/* Mother Card */}
              <div className="p-3.5 rounded-xl border border-border bg-card/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0 text-base">
                    👩
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">
                      {language === 'ar' ? 'هاتف الأم' : "Mother's Phone"}
                    </p>
                    <p className="text-sm font-bold text-foreground font-mono truncate" dir="ltr">
                      {motherPhone || '—'}
                    </p>
                  </div>
                </div>
                {motherPhone && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${motherPhone}`}
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      title={language === 'ar' ? 'اتصال هاتفياً' : 'Call'}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <a
                      href={`https://wa.me/${cleanPhoneNumber(motherPhone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {boy.notes && (
              <div className="flex items-start gap-3 sm:col-span-2">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('notes')}</p>
                  <p className="text-sm text-foreground mt-0.5">{boy.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visit History */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-xs">
        <h2 className="text-lg font-bold text-foreground mb-6">{t('visit_history')}</h2>
        <CheckInHistory
          checkIns={checkIns}
          totalCount={checkInCount}
          boyId={boy.id}
          isAdmin={isAdmin}
          currentPage={page}
          pageSize={PAGE_SIZE}
          onPageChange={(p) => refreshCheckIns(p)}
          onDeleted={() => refreshCheckIns(page)}
        />
      </div>

      <CheckInModal
        boyId={boy.id}
        boyName={boy.full_name}
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onSuccess={() => refreshCheckIns(1)}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteBoy}
        title={t('delete_boy_confirm_title')}
        description={t('delete_boy_confirm_desc')}
        confirmLabel={t('delete_profile')}
        isLoading={isPending}
      />
    </div>
  )
}
