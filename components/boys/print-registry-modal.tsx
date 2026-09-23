'use client'

import { useEffect, useRef, useState } from 'react'
import { Printer, X, FileText, Download, CheckCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button-custom'
import { formatDate } from '@/lib/utils'
import { downloadElementAsPdf } from '@/lib/export/pdf'
import { toast } from 'sonner'
import type { Boy } from '@/lib/types'

interface PrintRegistryModalProps {
  isOpen: boolean
  onClose: () => void
  boys: Boy[]
  kgLevel?: 'all' | 'kg1' | 'kg2'
  categoryLabel?: string
  academicYear?: string
}

export function PrintRegistryModal({
  isOpen,
  onClose,
  boys,
  kgLevel = 'all',
  categoryLabel,
  academicYear = '2025-2026 م',
}: PrintRegistryModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadPdf = async () => {
    setIsDownloading(true)
    const toastId = toast.loading('جاري توليد ملف الـ PDF عالي الدقة...')
    try {
      const ok = await downloadElementAsPdf('printable-registry-sheet', {
        filename: `سجل_الأولاد_فصل_الأمير_تادرس_${resolvedCategory}.pdf`,
        orientation: 'landscape',
      })
      if (ok) {
        toast.success('تم تنزيل ملف الـ PDF بنجاح! 📥✨', { id: toastId })
      } else {
        toast.error('تعذر توليد الـ PDF، يرجى استخدام زر الطباعة المباشرة', { id: toastId })
      }
    } catch {
      toast.error('حدث خطأ أثناء تنزيل الـ PDF', { id: toastId })
    } finally {
      setIsDownloading(false)
    }
  }

  // Prevent background scroll when modal is open & listen for Escape key
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const resolvedCategory =
    categoryLabel ||
    (kgLevel === 'kg1' ? 'KG1' : kgLevel === 'kg2' ? 'KG2' : 'جميع الفئات (الكل)')

  const todayStr = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const handlePrint = () => {
    try {
      window.print()
    } catch (err) {
      console.error('Trigger print error:', err)
    }
  }

  return (
    <div
      id="printable-registry-overlay"
      className="fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto bg-slate-950/80 backdrop-blur-md p-2 sm:p-6 transition-all animate-fade-in"
      dir="rtl"
    >
      {/* ─── Screen Control Bar (Hidden when printing) ─────────── */}
      <div className="no-print w-full max-w-6xl mb-4 bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>سجل الأولاد — معاينة وحفظ الـ PDF</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {resolvedCategory}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              كنيسة مارمرقس — فصل الأمير تادرس ({boys.length} ولد مقيد)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          <Button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-2.5 shadow-lg shadow-emerald-600/20 cursor-pointer gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'جاري التحميل...' : 'تحميل ملف PDF فوري 📥'}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            className="flex-1 sm:flex-none border-blue-500/50 bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 font-bold px-4 py-2.5 cursor-pointer gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة ورقية 🖨️</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white px-4 py-2.5 cursor-pointer"
            leftIcon={<X className="w-4 h-4" />}
          >
            إغلاق
          </Button>
        </div>
      </div>

      {/* ─── Mobile Tips Banner (Hidden when printing) ─────────── */}
      <div className="no-print w-full max-w-6xl mb-4 bg-gradient-to-r from-emerald-950/40 via-blue-950/40 to-indigo-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>تنزيل فوري:</strong> يمكنك تنزيل ملف الـ PDF مباشرة على هاتفك أو كمبيوترك بالضغط على{' '}
            <strong className="text-white">"تحميل ملف PDF فوري 📥"</strong>.
          </span>
        </div>
      </div>

      {/* ─── The Official Printable Document Sheet ─────────────── */}
      <div
        id="printable-registry-sheet"
        ref={modalRef}
        className="w-full max-w-6xl bg-white text-slate-900 rounded-2xl shadow-2xl p-4 sm:p-8 overflow-x-auto border border-slate-200"
      >
        {/* Church & Register Header */}
        <table className="w-full border-none border-b-2 border-slate-900 pb-3 mb-2">
          <tbody>
            <tr>
              <td className="w-1/3 text-right align-top border-none p-0 bg-transparent">
                <h3 className="text-sm font-bold text-blue-900 mb-1">
                  كنيسة مارمرقس — فصل الأمير تادرس
                </h3>
                <p className="text-xs text-slate-600">
                  فصل الأمير تادرس — سجل المتابعة والرعاية
                </p>
              </td>
              <td className="w-1/3 text-center align-top border-none p-0 bg-transparent">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 mb-1">
                  سجل الأولاد
                </h1>
                <p className="text-xs font-bold text-sky-700">
                  العام الدراسي {academicYear}
                </p>
              </td>
              <td className="w-1/3 text-left align-top border-none p-0 bg-transparent text-xs text-slate-600 leading-relaxed">
                <div>
                  <strong>تاريخ التصدير:</strong> {todayStr}
                </div>
                <div>
                  <strong>الفئة:</strong>{' '}
                  <span className="text-slate-950 font-bold">{resolvedCategory}</span>
                </div>
                <div>
                  <strong>إجمالي المقيدين:</strong>{' '}
                  <span className="text-slate-950 font-bold">{boys.length}</span> ولد
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Data Table */}
        <table className="print-data-table w-full border-collapse mt-4 text-[11px] leading-tight">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="w-[35px] text-center p-2 border border-slate-700 font-bold text-white bg-slate-900">
                م
              </th>
              <th className="w-[175px] text-right p-2 pr-3 border border-slate-700 font-bold text-white bg-slate-900">
                الاسم (ثلاثي)
              </th>
              <th className="w-[60px] text-center p-2 border border-slate-700 font-bold text-white bg-slate-900">
                المرحلة
              </th>
              <th className="w-[220px] text-right p-2 pr-3 border border-slate-700 font-bold text-white bg-slate-900">
                العنوان ومكان السكن
              </th>
              <th className="w-[85px] text-center p-2 border border-slate-700 font-bold text-white bg-slate-900">
                تاريخ الميلاد
              </th>
              <th className="w-[125px] text-center p-2 border border-slate-700 font-bold text-white bg-slate-900">
                هواتف أولياء الأمور
              </th>
              <th className="w-[85px] text-center p-2 border border-slate-700 font-bold text-white bg-slate-900">
                آخر زيارة
              </th>
              <th className="w-[55px] text-center p-2 border border-slate-700 font-bold text-white bg-slate-900">
                الزيارات
              </th>
              <th className="text-right p-2 pr-3 border border-slate-700 font-bold text-white bg-slate-900">
                ملاحظات
              </th>
            </tr>
          </thead>
          <tbody>
            {boys.map((boy, idx) => {
              const isKg2 = (boy.kg_level || '').toLowerCase() === 'kg2'
              const isEven = idx % 2 === 1
              const fPhone = boy.father_phone || boy.phone_number
              const mPhone = boy.mother_phone
              return (
                <tr
                  key={boy.id || idx}
                  className={isEven ? 'bg-slate-50' : 'bg-white'}
                >
                  <td className="text-center font-bold text-slate-500 p-1.5 border border-slate-300">
                    {idx + 1}
                  </td>
                  <td className="font-bold text-slate-900 pr-2.5 p-1.5 border border-slate-300">
                    {boy.full_name || '—'}
                  </td>
                  <td className="text-center p-1.5 border border-slate-300">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border ${
                        isKg2
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 badge-kg2'
                          : 'bg-blue-100 text-blue-800 border-blue-300 badge-kg1'
                      }`}
                    >
                      {(boy.kg_level || 'kg1').toUpperCase()}
                    </span>
                  </td>
                  <td className="pr-2.5 p-1.5 border border-slate-300 text-slate-800">
                    {boy.address || '—'}
                  </td>
                  <td className="text-center font-mono text-[10px] p-1.5 border border-slate-300 text-slate-700">
                    {boy.date_of_birth ? formatDate(boy.date_of_birth) : '—'}
                  </td>
                  <td className="text-center font-mono text-[10px] p-1.5 border border-slate-300 text-slate-800 leading-snug">
                    {fPhone && (
                      <div>
                        <strong className="text-blue-900 text-[9px]">الأب: </strong>
                        <span dir="ltr">{fPhone}</span>
                      </div>
                    )}
                    {mPhone && (
                      <div>
                        <strong className="text-pink-700 text-[9px]">الأم: </strong>
                        <span dir="ltr">{mPhone}</span>
                      </div>
                    )}
                    {!fPhone && !mPhone && '—'}
                  </td>
                  <td className="text-center text-[10px] p-1.5 border border-slate-300">
                    {boy.last_check_in ? (
                      <span className="text-slate-800 font-medium">
                        {formatDate(boy.last_check_in)}
                      </span>
                    ) : (
                      <span className="text-slate-400">لم يُزَر</span>
                    )}
                  </td>
                  <td className="text-center font-bold text-slate-800 p-1.5 border border-slate-300">
                    {boy.check_in_count ?? 0}
                  </td>
                  <td className="pr-2.5 p-1.5 border border-slate-300 text-[10px] text-slate-600">
                    {boy.notes || ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Footer Signatures */}
        <table className="w-full border-none border-t border-slate-300 mt-6 pt-4 text-xs text-slate-600">
          <tbody>
            <tr>
              <td className="w-1/3 text-right border-none p-0 bg-transparent">
                منظومة فصل الأمير تادرس — سجل رسمي معتمد
              </td>
              <td className="w-1/3 text-center border-none p-0 bg-transparent">
                توقيع خادم المرحلة: .......................................
              </td>
              <td className="w-1/3 text-left border-none p-0 bg-transparent">
                ختم وتوقيع أمين الخدمة: .......................................
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
