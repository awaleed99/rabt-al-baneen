'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Printer,
  Download,
  X,
  Users,
  CalendarCheck,
  PhoneCall,
  AlertTriangle,
  Cake,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button-custom'
import { getPriestMonthlyReport } from '@/lib/actions/reports'
import { ARABIC_MONTHS } from '@/lib/attendance-utils'
import { downloadElementAsPdf } from '@/lib/export/pdf'
import { toast } from 'sonner'
import type { PriestMonthlyReportData } from '@/lib/types'

interface PriestReportModalProps {
  isOpen: boolean
  onClose: () => void
  initialYear?: number
  initialMonth?: number
}

export function PriestReportModal({
  isOpen,
  onClose,
  initialYear,
  initialMonth,
}: PriestReportModalProps) {
  const today = new Date()
  const [year, setYear] = useState(initialYear || today.getFullYear())
  const [month, setMonth] = useState(initialMonth || today.getMonth() + 1)
  const [report, setReport] = useState<PriestMonthlyReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadPdf = async () => {
    if (!report) return
    setIsDownloading(true)
    const toastId = toast.loading('جاري توليد ملف التقرير الشهري كـ PDF...')
    try {
      const ok = await downloadElementAsPdf('priest-report-sheet', {
        filename: `التقرير_الشهري_فصل_الأمير_تادرس_${report.monthNameAr}_${report.year}.pdf`,
        orientation: 'portrait',
      })
      if (ok) {
        toast.success('تم تحميل التقرير الشهري كـ PDF بنجاح! 📄✨', { id: toastId })
      } else {
        toast.error('تعذر توليد الـ PDF، يرجى استخدام زر الطباعة المباشرة', { id: toastId })
      }
    } catch {
      toast.error('حدث خطأ أثناء تنزيل الـ PDF', { id: toastId })
    } finally {
      setIsDownloading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    let active = true
    setLoading(true)

    getPriestMonthlyReport(year, month)
      .then((data) => {
        if (active) setReport(data)
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isOpen, year, month])

  if (!isOpen) return null

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      dir="rtl"
    >
      <div className="relative w-full max-w-4xl max-h-[96vh] flex flex-col bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>تقرير أمين الخدمة الشامل (للمشرف العام والإدارة)</span>
              </h2>
              <p className="text-xs text-slate-400">
                ملخص إداري وتربوي شهري معتمد لفصل الأمير تادرس
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Month Navigator */}
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700/60 rounded-xl px-2 py-1 text-xs">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-slate-700 rounded-lg text-slate-300"
                title="الشهر السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="font-bold text-white px-2">
                {ARABIC_MONTHS[month - 1]} {year}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-slate-700 rounded-lg text-slate-300"
                title="الشهر التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <Button
              onClick={handleDownloadPdf}
              disabled={loading || !report || isDownloading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'جاري التحميل...' : 'تحميل PDF فوري 📥'}</span>
            </Button>

            <Button
              onClick={handlePrint}
              disabled={loading || !report}
              variant="outline"
              className="border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary font-bold gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة ورقية 🖨️</span>
            </Button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 text-slate-100 print:p-0 print:m-0 print:bg-white print:text-black">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-400">جاري إعداد التقرير الشهري وتجميع الإحصائيات...</p>
            </div>
          ) : report ? (
            <div
              id="priest-report-sheet"
              className="priest-report-sheet border border-slate-800 rounded-2xl p-6 sm:p-8 bg-slate-900/60 shadow-lg print:border-none print:p-0 print:bg-white"
            >
              
              {/* Header */}
              <div className="border-b-2 border-slate-700 pb-5 mb-6 text-center space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 print:text-slate-600">
                  <span>كنيسة الشهيد العظيم مارمرقس</span>
                  <span>فصل الأمير تادرس — مدارس الأحد</span>
                  <span>التاريخ: {new Date().toLocaleDateString('ar-EG')}</span>
                </div>

                <div className="py-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold">
                    كشف المتابعة والرعاية الدورية
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white print:text-slate-950 mt-1">
                    التقرير الشهري للخدمة — شهر {report.monthNameAr} {report.year}
                  </h1>
                </div>
              </div>

              {/* 4 KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 print:border-slate-300 print:bg-slate-50">
                  <div className="flex items-center justify-between text-slate-400 print:text-slate-600 text-xs mb-1">
                    <span>إجمالي المخدومين</span>
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-2xl font-extrabold text-white print:text-slate-950 font-mono">
                    {report.totalBoysCount} <span className="text-xs font-normal">ولد</span>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 print:border-slate-300 print:bg-slate-50">
                  <div className="flex items-center justify-between text-slate-400 print:text-slate-600 text-xs mb-1">
                    <span>نسبة الحضور للشهر</span>
                    <CalendarCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-400 print:text-emerald-700 font-mono">
                    {report.overallAttendanceRate}%
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 print:border-slate-300 print:bg-slate-50">
                  <div className="flex items-center justify-between text-slate-400 print:text-slate-600 text-xs mb-1">
                    <span>إجمالي الافتقادات</span>
                    <PhoneCall className="w-4 h-4 text-sky-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-sky-400 print:text-sky-700 font-mono">
                    {report.visitationsSummary.totalVisits} <span className="text-xs font-normal">تواصل</span>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 print:border-slate-300 print:bg-slate-50">
                  <div className="flex items-center justify-between text-slate-400 print:text-slate-600 text-xs mb-1">
                    <span>يحتاجون متابعة وافتقاد</span>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-amber-400 print:text-amber-700 font-mono">
                    {report.urgentCareBoys.length} <span className="text-xs font-normal">ولد</span>
                  </p>
                </div>
              </div>

              {/* Section 1: Perfect Attendance */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-emerald-400 print:text-emerald-800 flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>أولاً: أبطال الالتزام الكامل بالحضور (100% من جمع الشهر) — ({report.perfectAttendanceBoys.length} ولد)</span>
                </h3>
                {report.perfectAttendanceBoys.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                    لم يُسجل أي طفل نسبة حضور 100% لهذا الشهر حتى الآن.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {report.perfectAttendanceBoys.map((boy) => (
                      <div
                        key={boy.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold print:bg-emerald-50 print:border-emerald-200"
                      >
                        <span className="text-white print:text-slate-900 font-bold">{boy.full_name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 print:text-emerald-800 font-bold">
                          {boy.kg_level === 'kg2' ? 'KG2' : 'KG1'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Urgent Pastoral Care / Absences */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-amber-400 print:text-amber-800 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>ثانياً: أطفال يحتاجون متابعة وافتقاد خاص وتواصل تليفوني عاجل ({report.urgentCareBoys.length} ولد)</span>
                </h3>
                {report.urgentCareBoys.length === 0 ? (
                  <p className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 font-bold">
                    ممتاز! جميع الأطفال منتظمون وتتم متابعتهم بانتظام.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {report.urgentCareBoys.slice(0, 8).map((alert) => (
                      <div
                        key={alert.boy.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs print:bg-amber-50 print:border-amber-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white print:text-slate-900">{alert.boy.full_name}</span>
                          <span className="text-[10px] text-amber-300 print:text-amber-900 font-semibold">
                            ({alert.descriptionAr})
                          </span>
                        </div>
                        <span className="font-mono text-slate-400 print:text-slate-600 text-[11px]">
                          {alert.boy.father_phone || alert.boy.mother_phone || 'لا يوجد رقم'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Visitations breakdown */}
              <div className="mb-6 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 print:bg-slate-50 print:border-slate-300">
                <h3 className="text-sm font-bold text-sky-400 print:text-sky-800 mb-2">
                  ثالثاً: ملخص الافتقاد والتواصل الذي تم خلال الشهر
                </h3>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/40 print:bg-white">
                    <p className="text-slate-400 print:text-slate-600">📞 مكالمات</p>
                    <p className="font-extrabold text-white print:text-slate-900 text-base">{report.visitationsSummary.callCount}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/40 print:bg-white">
                    <p className="text-slate-400 print:text-slate-600">🏠 منزلي</p>
                    <p className="font-extrabold text-white print:text-slate-900 text-base">{report.visitationsSummary.homeCount}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/40 print:bg-white">
                    <p className="text-slate-400 print:text-slate-600">⛪ كنسي</p>
                    <p className="font-extrabold text-white print:text-slate-900 text-base">{report.visitationsSummary.churchCount}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/40 print:bg-white">
                    <p className="text-slate-400 print:text-slate-600">🩺 صحي</p>
                    <p className="font-extrabold text-white print:text-slate-900 text-base">{report.visitationsSummary.healthCount}</p>
                  </div>
                </div>
              </div>

              {/* Section 4: Birthdays of Month */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-purple-400 print:text-purple-800 flex items-center gap-2 mb-2">
                  <Cake className="w-4 h-4" />
                  <span>رابعاً: أعياد ميلاد أطفال الشهر ({report.birthdaysThisMonth.length} طفل)</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {report.birthdaysThisMonth.map((b) => (
                    <span
                      key={b.id}
                      className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-200 print:text-purple-900 text-xs font-semibold"
                    >
                      🎂 {b.full_name} ({b.birthDay} {report.monthNameAr})
                    </span>
                  ))}
                  {report.birthdaysThisMonth.length === 0 && (
                    <p className="text-xs text-slate-400 italic">لا توجد أعياد ميلاد مسجلة في هذا الشهر.</p>
                  )}
                </div>
              </div>

              {/* Official Signatures & Directives */}
              <div className="pt-6 border-t-2 border-slate-700 grid grid-cols-2 gap-4 text-xs font-bold text-slate-300 print:text-slate-900">
                <div className="space-y-8">
                  <p>توقيع مسؤول فصل الأمير تادرس:</p>
                  <p className="text-slate-500 print:text-slate-600 font-mono">....................................................</p>
                </div>
                <div className="space-y-8 text-left">
                  <p>ملاحظات وتوجيهات المشرف العام / الإدارة:</p>
                  <p className="text-slate-500 print:text-slate-600 font-mono">....................................................</p>
                </div>
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
