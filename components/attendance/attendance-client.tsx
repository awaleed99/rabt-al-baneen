'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  Award,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Check,
  X,
  Clock,
  Sparkles,
  Loader2,
  Calendar,
  CheckCheck,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar-custom'
import { Button } from '@/components/ui/button-custom'
import { Input } from '@/components/ui/input-custom'
import { cn } from '@/lib/utils'
import { isTodayBirthday } from '@/lib/birthday'
import { downloadElementAsPdf } from '@/lib/export/pdf'
import {
  toggleAttendance,
  bulkSetFridayAttendance,
  getMonthlyAttendance,
} from '@/lib/actions/attendance'
import { exportMonthlyAttendanceExcel } from '@/lib/export/attendance-excel'
import type {
  AttendanceStatus,
  BoyAttendanceRow,
  FridayInfo,
  MonthlyAttendanceData,
} from '@/lib/types'
import { useLanguage } from '@/lib/i18n/context'
import { toast } from 'sonner'

interface AttendanceClientProps {
  initialData: MonthlyAttendanceData
  isAdmin: boolean
}

export function AttendanceClient({ initialData, isAdmin }: AttendanceClientProps) {
  const { language, isRTL } = useLanguage()
  const router = useRouter()
  const [data, setData] = useState<MonthlyAttendanceData>(initialData)
  const [kgFilter, setKgFilter] = useState<'all' | 'kg1' | 'kg2'>('all')
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [togglingCell, setTogglingCell] = useState<string | null>(null)

  // Current year & month
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  const isCurrentMonth = data.year === currentYear && data.month === currentMonth

  // Navigation handlers
  const navigateMonth = (direction: 'prev' | 'next') => {
    let newYear = data.year
    let newMonth = direction === 'next' ? data.month + 1 : data.month - 1

    if (newMonth > 12) {
      newMonth = 1
      newYear++
    } else if (newMonth < 1) {
      newMonth = 12
      newYear--
    }

    startTransition(async () => {
      const refreshed = await getMonthlyAttendance(newYear, newMonth, kgFilter)
      setData(refreshed)
    })
  }

  const goToCurrentMonth = () => {
    startTransition(async () => {
      const refreshed = await getMonthlyAttendance(currentYear, currentMonth, kgFilter)
      setData(refreshed)
    })
  }

  const handleFilterChange = (kg: 'all' | 'kg1' | 'kg2') => {
    setKgFilter(kg)
    startTransition(async () => {
      const refreshed = await getMonthlyAttendance(data.year, data.month, kg)
      setData(refreshed)
    })
  }

  // Attendance Toggle Handler (with Optimistic UI update)
  const handleToggleAttendance = async (boyId: string, fridayDate: string) => {
    const currentStatus =
      data.rows.find((r) => r.boy.id === boyId)?.attendance[fridayDate] || 'absent'
    const newStatus: AttendanceStatus = currentStatus === 'present' ? 'absent' : 'present'

    const cellKey = `${boyId}-${fridayDate}`
    setTogglingCell(cellKey)

    // Optimistically update state
    setData((prev) => {
      const updatedRows = prev.rows.map((row) => {
        if (row.boy.id !== boyId) return row

        const updatedAttendance = {
          ...row.attendance,
          [fridayDate]: newStatus,
        }

        let presentCount = 0
        for (const f of prev.fridays) {
          if (updatedAttendance[f.date] === 'present') presentCount++
        }

        const attendanceRate =
          prev.fridays.length > 0
            ? Math.round((presentCount / prev.fridays.length) * 100)
            : 0

        return {
          ...row,
          attendance: updatedAttendance,
          presentCount,
          attendanceRate,
        }
      })

      // Recalculate monthly KPI stats
      let totalPresences = 0
      let perfectCount = 0
      const totalSlots = updatedRows.length * prev.fridays.length

      for (const r of updatedRows) {
        totalPresences += r.presentCount
        if (prev.fridays.length > 0 && r.presentCount === prev.fridays.length) {
          perfectCount++
        }
      }

      return {
        ...prev,
        rows: updatedRows,
        stats: {
          ...prev.stats,
          overallAttendanceRate:
            totalSlots > 0 ? Math.round((totalPresences / totalSlots) * 100) : 0,
          perfectAttendanceCount: perfectCount,
        },
      }
    })

    try {
      const res = await toggleAttendance(boyId, fridayDate, newStatus)
      if (!res.success) {
        toast.error(`تعذر حفظ الحضور: ${res.error}`)
      }
    } catch {
      toast.error('حدث خطأ أثناء حفظ الحضور')
    } finally {
      setTogglingCell(null)
    }
  }

  // Bulk mark all present for a specific Friday
  const handleBulkMarkFriday = async (fridayDate: string, status: AttendanceStatus) => {
    const boyIds = data.rows.map((r) => r.boy.id)
    if (boyIds.length === 0) return

    startTransition(async () => {
      // Optimistic update
      setData((prev) => {
        const updatedRows = prev.rows.map((row) => {
          const updatedAttendance = {
            ...row.attendance,
            [fridayDate]: status,
          }
          let presentCount = 0
          for (const f of prev.fridays) {
            if (updatedAttendance[f.date] === 'present') presentCount++
          }
          const attendanceRate =
            prev.fridays.length > 0
              ? Math.round((presentCount / prev.fridays.length) * 100)
              : 0

          return {
            ...row,
            attendance: updatedAttendance,
            presentCount,
            attendanceRate,
          }
        })

        return {
          ...prev,
          rows: updatedRows,
        }
      })

      const res = await bulkSetFridayAttendance(fridayDate, status, boyIds)
      if (res.success) {
        toast.success(
          status === 'present'
            ? 'تم تسجيل حضور جميع الأولاد في هذه الجمعة بنجاح!'
            : 'تم إلغاء تسجيل الحضور في هذه الجمعة'
        )
      } else {
        toast.error(`تعذر التحديث الجماعي: ${res.error}`)
      }
    })
  }

  // Export Excel
  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await exportMonthlyAttendanceExcel(data)
      toast.success('تم تنزيل كشف حضور الشهر بصيغة إكسيل بنجاح!')
    } catch (e: any) {
      toast.error(`فشل تصدير الإكسيل: ${e.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  // Export PDF
  const handleExportPdf = async () => {
    setIsExportingPdf(true)
    const toastId = toast.loading('جاري تجهيز وتنزيل كشف الحضور كـ PDF...')
    try {
      const ok = await downloadElementAsPdf('attendance-monthly-pdf-sheet', {
        filename: `كشف_حضور_${data.monthNameAr}_${data.year}.pdf`,
        orientation: 'landscape',
      })
      if (ok) {
        toast.success('تم تنزيل كشف الحضور بنجاح! 📄✨', { id: toastId })
      } else {
        toast.error('تعذر توليد الـ PDF، يرجى المحاولة لاحقاً', { id: toastId })
      }
    } catch {
      toast.error('حدث خطأ أثناء تنزيل الـ PDF', { id: toastId })
    } finally {
      setIsExportingPdf(false)
    }
  }

  // Filter rows by search term
  const filteredRows = data.rows.filter((r) =>
    search.trim() ? r.boy.full_name.toLowerCase().includes(search.trim().toLowerCase()) : true
  )

  // Check if today is one of the Fridays
  const todayFriday = data.fridays.find((f) => f.isToday)

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* ─── Top Header & Controls ────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <CalendarCheck className="w-6 h-6" />
            </span>
            <span>كشف حضور الجمعة شهرياً</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            كنيسة مارمرقس — فصل الأمير تادرس (تسجيل ومتابعة حضور الأولاد كل جمعة)
          </p>
        </div>

        {/* Month Navigator & Export Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center bg-card border border-border rounded-xl p-1 shadow-xs">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              disabled={isPending}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
              title="الشهر السابق"
            >
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <div className="px-3 text-sm font-bold text-foreground min-w-[130px] text-center flex items-center justify-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{data.monthNameAr} {data.year}</span>
            </div>

            <button
              type="button"
              onClick={() => navigateMonth('next')}
              disabled={isPending}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
              title="الشهر التالي"
            >
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {!isCurrentMonth && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goToCurrentMonth}
              disabled={isPending}
              className="text-xs"
            >
              الشهر الحالي
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={handleExportPdf}
            disabled={isExportingPdf || filteredRows.length === 0}
            className="border-primary/40 text-primary hover:bg-primary/10 font-bold gap-2 cursor-pointer"
          >
            <Download className={cn('w-4 h-4', isExportingPdf && 'animate-spin')} />
            <span>{isExportingPdf ? 'جاري التحميل...' : 'تصدير PDF 📄'}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleExportExcel}
            disabled={isExporting || filteredRows.length === 0}
            className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
            leftIcon={
              isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )
            }
          >
            تصدير كشف الشهر (Excel)
          </Button>
        </div>
      </div>

      {/* ─── Today is Friday Alert Banner ─────────────────────── */}
      {todayFriday && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-blue-500/20 border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/10 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3 text-center sm:text-right">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 justify-center sm:justify-start">
                <span>اليوم هو يوم الجمعة المبارك ({todayFriday.labelAr})!</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-bold border border-emerald-500/30">
                  جمعة اليوم
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                يمكنك تسجيل حضور الأولاد مباشرة في الجدول أدناه أو تحضير الجميع بضغطة زر.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => handleBulkMarkFriday(todayFriday.date, 'present')}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20 shrink-0"
            leftIcon={<CheckCheck className="w-4 h-4" />}
          >
            تسجيل حضور الجميع اليوم ✓
          </Button>
        </div>
      )}

      {/* ─── Monthly KPI Cards ────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Overall Attendance % */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">نسبة حضور الشهر</p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">
              {data.stats.overallAttendanceRate}%
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              من إجمالي حصص جمعات الشهر
            </p>
          </div>
        </div>

        {/* Total Fridays in Month */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">عدد جمعات الشهر</p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">
              {data.stats.totalFridays} جمعات
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              في شهر {data.monthNameAr} {data.year}
            </p>
          </div>
        </div>

        {/* 100% Attendance Champions */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">أبطال الالتزام الكامل</p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5 flex items-center gap-1.5">
              <span>{data.stats.perfectAttendanceCount}</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">
                100% ⭐
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              حضروا كافة جمعات الشهر
            </p>
          </div>
        </div>

        {/* Total Registered Boys */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">إجمالي الأولاد المقيدين</p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">
              {data.stats.totalBoys} ولد
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {data.rows.filter((r) => r.boy.kg_level === 'kg1').length} KG1 /{' '}
              {data.rows.filter((r) => r.boy.kg_level === 'kg2').length} KG2
            </p>
          </div>
        </div>
      </div>

      {/* ─── Search & Stage Filters ───────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="w-full sm:max-w-xs">
          <Input
            placeholder="البحث باسم الطفل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
          />
        </div>

        {/* KG Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground">المرحلة:</span>
          <button
            type="button"
            onClick={() => handleFilterChange('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
              kgFilter === 'all'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-muted/60 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
            )}
          >
            الكل ({data.stats.totalBoys})
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange('kg1')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
              kgFilter === 'kg1'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 hover:bg-blue-500/20'
            )}
          >
            KG1
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange('kg2')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
              kgFilter === 'kg2'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
            )}
          >
            KG2
          </button>
        </div>
      </div>

      {/* ─── Interactive Attendance Matrix Table ──────────────── */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-muted/60 border-b border-border text-muted-foreground text-xs">
                {/* Index */}
                <th className="p-3 text-center w-12 font-bold">م</th>

                {/* Child Name & Stage */}
                <th className="p-3 pr-4 font-bold min-w-[200px]">الطفل</th>

                {/* Friday Columns */}
                {data.fridays.map((friday) => {
                  let fridayPresentCount = 0
                  for (const r of data.rows) {
                    if (r.attendance[friday.date] === 'present') fridayPresentCount++
                  }

                  return (
                    <th
                      key={friday.date}
                      className={cn(
                        'p-3 text-center min-w-[130px] border-r border-border/60 transition-colors',
                        friday.isToday && 'bg-emerald-500/10 border-emerald-500/30'
                      )}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5 font-extrabold text-foreground">
                          <span>{friday.labelAr}</span>
                          {friday.isToday && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-semibold text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                            {fridayPresentCount} / {data.rows.length} حاضر
                          </span>

                          {/* Quick bulk mark menu for this Friday */}
                          <button
                            type="button"
                            onClick={() => handleBulkMarkFriday(friday.date, 'present')}
                            disabled={isPending}
                            className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
                            title="تحضير جميع الأولاد في هذه الجمعة"
                          >
                            [تحضير الكل]
                          </button>
                        </div>
                      </div>
                    </th>
                  )
                })}

                {/* Attendance Rate */}
                <th className="p-3 text-center w-28 font-bold border-r border-border/60">
                  نسبة الشهر
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={3 + data.fridays.length}
                    className="py-12 text-center text-muted-foreground text-sm"
                  >
                    لا توجد بيانات مطابقة للبحث أو الفلتر الحالي.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const isKg2 = (row.boy.kg_level || '').toLowerCase() === 'kg2'
                  const isBirthday = isTodayBirthday(row.boy.date_of_birth)
                  const isPerfect =
                    data.fridays.length > 0 && row.presentCount === data.fridays.length

                  return (
                    <tr
                      key={row.boy.id}
                      className={cn(
                        'hover:bg-muted/30 transition-colors',
                        isBirthday && 'bg-amber-500/5'
                      )}
                    >
                      {/* Index */}
                      <td className="p-3 text-center text-xs font-bold text-muted-foreground">
                        {idx + 1}
                      </td>

                      {/* Child Info with Birthday Hat */}
                      <td className="p-3 pr-4">
                        <Link
                          href={`/boys/${row.boy.id}`}
                          className="flex items-center gap-3 group"
                        >
                          <Avatar
                            name={row.boy.full_name}
                            imageUrl={row.boy.profile_image_url}
                            size="sm"
                            hasBirthdayHat={isBirthday}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors truncate flex items-center gap-1.5">
                              <span>{row.boy.full_name}</span>
                              {isBirthday && (
                                <span className="text-xs select-none" title="عيد ميلاد سعيد! 🎂">
                                  🎂
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={cn(
                                  'text-[10px] font-bold px-1.5 py-0.2 rounded',
                                  isKg2
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                                )}
                              >
                                {(row.boy.kg_level || 'kg1').toUpperCase()}
                              </span>
                              {isBirthday && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                  اليوم عيد ميلاده! 🎉
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* Attendance Buttons per Friday */}
                      {data.fridays.map((friday) => {
                        const status = row.attendance[friday.date]
                        const isPresent = status === 'present'
                        const cellKey = `${row.boy.id}-${friday.date}`
                        const isToggling = togglingCell === cellKey

                        return (
                          <td
                            key={friday.date}
                            className={cn(
                              'p-2.5 text-center border-r border-border/60',
                              friday.isToday && 'bg-emerald-500/5'
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleAttendance(row.boy.id, friday.date)}
                              disabled={isToggling}
                              className={cn(
                                'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs select-none active:scale-95',
                                isPresent
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-emerald-600/20'
                                  : 'bg-muted/50 hover:bg-muted text-muted-foreground border-border hover:text-foreground'
                              )}
                              title={
                                isPresent
                                  ? 'اضغط لتسجيل غياب'
                                  : 'اضغط لتسجيل حضور'
                              }
                            >
                              {isToggling ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : isPresent ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>حاضر</span>
                                </>
                              ) : (
                                <>
                                  <X className="w-3.5 h-3.5 opacity-50" />
                                  <span>غائب</span>
                                </>
                              )}
                            </button>
                          </td>
                        )
                      })}

                      {/* Attendance Summary */}
                      <td className="p-3 text-center border-r border-border/60">
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-full text-xs font-extrabold',
                              isPerfect
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                : row.attendanceRate >= 75
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : row.attendanceRate >= 50
                                ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {row.attendanceRate}% {isPerfect && '⭐'}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {row.presentCount} من {data.fridays.length}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Printable Monthly Attendance Sheet for PDF Capture ─── */}
      <div
        id="attendance-monthly-pdf-sheet"
        className="hidden print:block"
        style={{
          backgroundColor: '#ffffff',
          color: '#0f172a',
          padding: '24px',
          fontFamily: 'Cairo, sans-serif',
          direction: 'rtl',
        }}
      >
        <div
          style={{
            borderBottom: '3px solid #0f172a',
            paddingBottom: '16px',
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              color: '#475569',
              marginBottom: '6px',
            }}
          >
            <span style={{ fontWeight: 'bold' }}>كنيسة الشهيد العظيم مارمرقس — فصل الأمير تادرس</span>
            <span>العام الدراسي 2025-2026 م</span>
            <span>تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>
            كشف حضور جمعات شهر {data.monthNameAr} ({data.year})
          </h1>
          <p style={{ fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>
            إجمالي المقيدين: {data.rows.length} ولد • متوسط نسبة الحضور: {data.stats.overallAttendanceRate}% • عدد الجمعات: {data.fridays.length} جمعة
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'right' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
              <th style={{ padding: '8px 10px', border: '1px solid #334155', textAlign: 'center', width: '36px' }}>م</th>
              <th style={{ padding: '8px 10px', border: '1px solid #334155', textAlign: 'right' }}>اسم الطفل (ثلاثي)</th>
              <th style={{ padding: '8px 10px', border: '1px solid #334155', textAlign: 'center', width: '60px' }}>المرحلة</th>
              {data.fridays.map((f, i) => (
                <th key={f.date} style={{ padding: '8px 6px', border: '1px solid #334155', textAlign: 'center' }}>
                  <div>جمعة ({i + 1})</div>
                  <div style={{ fontSize: '9px', fontWeight: 'normal', opacity: 0.85 }}>{f.dayNumber} {data.monthNameAr}</div>
                </th>
              ))}
              <th style={{ padding: '8px 10px', border: '1px solid #334155', textAlign: 'center', width: '75px' }}>نسبة الحضور</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, idx) => (
              <tr
                key={row.boy.id}
                style={{
                  backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <td style={{ padding: '8px 6px', border: '1px solid #cbd5e1', textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold', color: '#64748b' }}>
                  {idx + 1}
                </td>
                <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#0f172a' }}>
                  {row.boy.full_name}
                </td>
                <td style={{ padding: '8px 6px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      backgroundColor: row.boy.kg_level === 'kg2' ? '#dcfce7' : '#dbeafe',
                      color: row.boy.kg_level === 'kg2' ? '#166534' : '#1e40af',
                    }}
                  >
                    {row.boy.kg_level === 'kg2' ? 'KG2' : 'KG1'}
                  </span>
                </td>
                {data.fridays.map((f) => {
                  const status = row.attendance[f.date]
                  return (
                    <td key={f.date} style={{ padding: '8px 6px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                      {status === 'present' ? (
                        <span style={{ fontWeight: 'bold', color: '#15803d' }}>✓ حاضر</span>
                      ) : status === 'excused' ? (
                        <span style={{ fontWeight: 'bold', color: '#b45309' }}>عذر</span>
                      ) : (
                        <span style={{ color: '#dc2626', fontFamily: 'monospace' }}>✗ غياب</span>
                      )}
                    </td>
                  )
                })}
                <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: '800', fontFamily: 'monospace', color: '#0f172a' }}>
                  {row.attendanceRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Endorsement Footer */}
        <div
          style={{
            paddingTop: '20px',
            marginTop: '20px',
            borderTop: '2px solid #0f172a',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#1e293b',
          }}
        >
          <div>
            <p>توقيع مسؤول المرحلة</p>
            <p style={{ color: '#94a3b8', marginTop: '24px', fontFamily: 'monospace' }}>.......................................</p>
          </div>
          <div>
            <p>ختم واعتماد الإدارة</p>
            <div
              style={{
                width: '60px',
                height: '60px',
                border: '1px dashed #94a3b8',
                borderRadius: '50%',
                margin: '8px auto 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                color: '#94a3b8',
              }}
            >
              ختم الإدارة
            </div>
          </div>
          <div>
            <p>اعتماد وتوقيع المشرف العام</p>
            <p style={{ color: '#94a3b8', marginTop: '24px', fontFamily: 'monospace' }}>.......................................</p>
          </div>
        </div>
      </div>
    </div>
  )
}
