'use client'

import { useState, useTransition } from 'react'
import {
  Cake,
  Calendar,
  Gift,
  Printer,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  Phone,
  Sparkles,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button-custom'
import { Avatar } from '@/components/ui/avatar-custom'
import { getMonthBirthdaysData } from '@/lib/actions/birthdays'
import { ARABIC_MONTHS } from '@/lib/attendance-utils'
import { getWhatsAppGreetingUrl } from '@/lib/birthday'
import type { BirthdayBoyInfo, MonthlyBirthdaysData } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BirthdaysClientProps {
  initialData: MonthlyBirthdaysData
}

export function BirthdaysClient({ initialData }: BirthdaysClientProps) {
  const [data, setData] = useState<MonthlyBirthdaysData>(initialData)
  const [activeMonth, setActiveMonth] = useState<number>(initialData.month)
  const [filterKg, setFilterKg] = useState<'all' | 'kg1' | 'kg2'>('all')
  const [isPending, startTransition] = useTransition()

  const handleSelectMonth = (monthNum: number) => {
    setActiveMonth(monthNum)
    startTransition(async () => {
      const res = await getMonthBirthdaysData(monthNum, data.year)
      setData(res)
    })
  }

  const handlePrevMonth = () => {
    const prev = activeMonth === 1 ? 12 : activeMonth - 1
    handleSelectMonth(prev)
  }

  const handleNextMonth = () => {
    const next = activeMonth === 12 ? 1 : activeMonth + 1
    handleSelectMonth(next)
  }

  const filteredBoys = data.boys.filter((b) => {
    if (filterKg === 'kg1') return b.kg_level === 'kg1'
    if (filterKg === 'kg2') return b.kg_level === 'kg2'
    return true
  })

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Cake className="w-6 h-6" />
            </span>
            <span>أعياد ميلاد الطلبة الشهرية</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            كنيسة مارمرقس — فصل الأمير تادرس (متابعة وتجهيز أعياد الميلاد لكل شهر والتهنئة المباشرة)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            onClick={handlePrint}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة كشف أعياد الميلاد (PDF)</span>
          </Button>
        </div>
      </div>

      {/* 12 Months Horizontal Selector Bar */}
      <div className="bg-card border border-border rounded-2xl p-2 shadow-xs">
        <div className="flex items-center justify-between mb-2 px-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              disabled={isPending}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              title="الشهر السابق"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <h2 className="font-extrabold text-foreground text-base sm:text-lg flex items-center gap-2">
              <span>شهر {data.monthNameAr} ({data.year})</span>
              {data.stats.todayCount > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                  🎉 {data.stats.todayCount} يحتفلون اليوم!
                </span>
              )}
            </h2>
            <button
              onClick={handleNextMonth}
              disabled={isPending}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              title="الشهر التالي"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* KG Filter */}
          <div className="hidden sm:inline-flex items-center bg-muted rounded-xl p-1 text-xs">
            <button
              onClick={() => setFilterKg('all')}
              className={cn('px-2.5 py-0.5 rounded-lg font-bold', filterKg === 'all' && 'bg-card text-foreground shadow-xs')}
            >
              الكل ({data.boys.length})
            </button>
            <button
              onClick={() => setFilterKg('kg1')}
              className={cn('px-2.5 py-0.5 rounded-lg font-bold', filterKg === 'kg1' && 'bg-blue-600 text-white shadow-xs')}
            >
              KG1 ({data.stats.kg1Count})
            </button>
            <button
              onClick={() => setFilterKg('kg2')}
              className={cn('px-2.5 py-0.5 rounded-lg font-bold', filterKg === 'kg2' && 'bg-emerald-600 text-white shadow-xs')}
            >
              KG2 ({data.stats.kg2Count})
            </button>
          </div>
        </div>

        {/* 12 Months Pills Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 pt-1 border-t border-border/60">
          {ARABIC_MONTHS.map((mName, idx) => {
            const mNum = idx + 1
            const isSelected = activeMonth === mNum
            const currentActualMonth = new Date().getMonth() + 1
            const isCurrentMonth = mNum === currentActualMonth

            return (
              <button
                key={mNum}
                onClick={() => handleSelectMonth(mNum)}
                disabled={isPending}
                className={cn(
                  'py-2 px-1 rounded-xl text-center transition-all flex flex-col items-center justify-center relative overflow-hidden',
                  isSelected
                    ? 'bg-purple-600 text-white font-extrabold shadow-sm'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold',
                  isCurrentMonth && !isSelected && 'ring-1 ring-purple-500/50'
                )}
              >
                <span className="text-[11px] truncate w-full">{mName}</span>
                <span className="text-[9px] opacity-75 font-mono">شهر {mNum}</span>
                {isCurrentMonth && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1 end-1" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">أعياد ميلاد شهر {data.monthNameAr}</p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5 font-mono">
              {data.stats.totalThisMonth} <span className="text-xs font-normal text-muted-foreground">طفل</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Gift className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">توزيع الفئات (KG1 / KG2)</p>
            <p className="text-sm font-bold text-foreground mt-1 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400">
                KG1: {data.stats.kg1Count}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                KG2: {data.stats.kg2Count}
              </span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-amber-500/30 bg-amber-500/5 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-700 dark:text-amber-300 font-bold">يحتفلون اليوم 🎉</p>
            <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-0.5 font-mono">
              {data.stats.todayCount} <span className="text-xs font-normal">طفل</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center animate-bounce">
            <Cake className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Celebrants Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredBoys.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-card border border-border rounded-2xl">
            <Cake className="w-10 h-10 mx-auto mb-2 opacity-40 text-purple-400" />
            <p className="font-bold text-base">لا توجد أعياد ميلاد مسجلة في شهر {data.monthNameAr}</p>
            <p className="text-xs text-muted-foreground mt-1">
              اختر شهراً آخر من الشريط أعلاه أو أضف تواريخ ميلاد للأولاد من صفحة الدليل
            </p>
          </div>
        ) : (
          filteredBoys.map((boy) => {
            const fatherPhone = boy.father_phone || boy.phone_number
            const motherPhone = boy.mother_phone

            return (
              <div
                key={boy.id}
                className={cn(
                  'bg-card border rounded-2xl p-4.5 flex flex-col justify-between shadow-xs transition-all hover:shadow-md relative overflow-hidden',
                  boy.isToday
                    ? 'border-amber-400 ring-2 ring-amber-400/30 bg-gradient-to-br from-amber-500/10 via-card to-purple-500/5 shadow-md shadow-amber-500/10'
                    : 'border-border'
                )}
              >
                <div>
                  {/* Top Bar with Date Badge & Age */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {/* Prominent Day Badge */}
                    <div className="flex items-center gap-2 bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 rounded-xl px-2.5 py-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-500" />
                      <span className="font-extrabold text-foreground text-xs">
                        {boy.birthDay} {data.monthNameAr}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        ({boy.dayNameAr})
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-500/30">
                        🎂 يتم {boy.turningAge} سنوات
                      </span>
                    </div>
                  </div>

                  {/* Boy Identity */}
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar
                      name={boy.full_name}
                      imageUrl={boy.profile_image_url}
                      size="lg"
                      hasBirthdayHat={boy.isToday}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-foreground truncate text-base">
                          {boy.full_name}
                        </h3>
                        {boy.isToday && <span className="text-base select-none">🎈</span>}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-md border',
                            boy.kg_level === 'kg2'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30'
                          )}
                        >
                          {boy.kg_level === 'kg2' ? 'KG2' : 'KG1'}
                        </span>

                        {boy.isToday && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-slate-950 shadow-xs animate-pulse">
                            <span>🎉 عيد ميلاده اليوم!</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parents WhatsApp & Call Bar */}
                <div className="pt-2.5 border-t border-border/60 space-y-1.5">
                  <p className="text-[11px] text-muted-foreground font-semibold flex items-center justify-between">
                    <span>إرسال تهنئة بالواتساب:</span>
                    <span>📞 اتصال</span>
                  </p>

                  <div className="flex items-center gap-2">
                    {fatherPhone ? (
                      <a
                        href={getWhatsAppGreetingUrl(fatherPhone, boy.full_name, 'father') || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-102"
                        title="إرسال تهنئة للأب"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>تهنئة الأب 👨</span>
                      </a>
                    ) : (
                      <span className="flex-1 py-1.5 text-center text-[10px] text-muted-foreground bg-muted/40 rounded-xl">
                        لا يوجد هاتف أب
                      </span>
                    )}

                    {motherPhone ? (
                      <a
                        href={getWhatsAppGreetingUrl(motherPhone, boy.full_name, 'mother') || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-102"
                        title="إرسال تهنئة للأم"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>تهنئة الأم 👩</span>
                      </a>
                    ) : (
                      <span className="flex-1 py-1.5 text-center text-[10px] text-muted-foreground bg-muted/40 rounded-xl">
                        لا يوجد هاتف أم
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Printable Sheet for the Month (Shown only during Print) */}
      <div className="hidden print:block print:p-6 print:bg-white print:text-black">
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
          <h2 className="text-sm font-bold text-slate-600">كنيسة مارمرقس — فصل الأمير تادرس</h2>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            كشف أعياد ميلاد شهر {data.monthNameAr} ({data.year})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إجمالي المحتفلين: {data.boys.length} طفل | تم الاستخراج بتاريخ: {new Date().toLocaleDateString('ar-EG')}
          </p>
        </div>

        <table className="w-full text-right border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300">
              <th className="p-2 border">م</th>
              <th className="p-2 border">اسم الطفل</th>
              <th className="p-2 border">المرحلة</th>
              <th className="p-2 border">تاريخ الميلاد</th>
              <th className="p-2 border">يوم الأسبوع</th>
              <th className="p-2 border">العمر الجديد</th>
              <th className="p-2 border">موبايل الأب</th>
              <th className="p-2 border">موبايل الأم</th>
            </tr>
          </thead>
          <tbody>
            {filteredBoys.map((b, idx) => (
              <tr key={b.id} className="border-b border-slate-200">
                <td className="p-2 border font-mono">{idx + 1}</td>
                <td className="p-2 border font-bold">{b.full_name}</td>
                <td className="p-2 border">{b.kg_level === 'kg2' ? 'KG2' : 'KG1'}</td>
                <td className="p-2 border font-mono">{b.birthDay} {data.monthNameAr}</td>
                <td className="p-2 border">{b.dayNameAr}</td>
                <td className="p-2 border font-bold">{b.turningAge} سنوات</td>
                <td className="p-2 border font-mono">{b.father_phone || '—'}</td>
                <td className="p-2 border font-mono">{b.mother_phone || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
