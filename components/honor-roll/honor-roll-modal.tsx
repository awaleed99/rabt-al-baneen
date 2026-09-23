'use client'

import { useState } from 'react'
import {
  Trophy,
  Star,
  Award,
  Sparkles,
  Printer,
  X,
  Heart,
  Crown,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button-custom'
import { Avatar } from '@/components/ui/avatar-custom'
import type { Boy } from '@/lib/types'
import { cn } from '@/lib/utils'

interface HonorRollModalProps {
  isOpen: boolean
  onClose: () => void
  boys: Boy[]
  academicYear?: string
  monthName?: string
}

export function HonorRollModal({
  isOpen,
  onClose,
  boys,
  academicYear = '2025-2026 م',
  monthName = 'سبتمبر 2026',
}: HonorRollModalProps) {
  const [filterKg, setFilterKg] = useState<'all' | 'kg1' | 'kg2'>('all')

  if (!isOpen) return null

  const filteredBoys = boys.filter((b) => {
    if (filterKg === 'kg1') return b.kg_level === 'kg1'
    if (filterKg === 'kg2') return b.kg_level === 'kg2'
    return true
  })

  const handlePrint = () => {
    window.print()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      dir="rtl"
    >
      <div className="relative w-full max-w-5xl max-h-[96vh] flex flex-col bg-slate-950 border border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>لوحة الشرف للأطفال — جاهزة للطباعة</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  {filteredBoys.length} بطل
                </span>
              </h2>
              <p className="text-xs text-amber-300/70">
                تصميم مبهج واحتفالي مخصص لتكريم أطفال فصل الأمير تادرس
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Filter buttons */}
            <div className="hidden sm:inline-flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setFilterKg('all')}
                className={cn(
                  'px-3 py-1 rounded-lg font-bold transition-all',
                  filterKg === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                الكل ({boys.length})
              </button>
              <button
                onClick={() => setFilterKg('kg1')}
                className={cn(
                  'px-3 py-1 rounded-lg font-bold transition-all',
                  filterKg === 'kg1'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                KG1
              </button>
              <button
                onClick={() => setFilterKg('kg2')}
                className={cn(
                  'px-3 py-1 rounded-lg font-bold transition-all',
                  filterKg === 'kg2'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                KG2
              </button>
            </div>

            <Button
              onClick={handlePrint}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold shadow-md shadow-amber-500/20 gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كـ PDF</span>
            </Button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Honor Roll Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 text-slate-100 print:p-0 print:m-0 print:bg-white print:text-black">
          <div className="honor-roll-printable border-4 border-amber-500/60 rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-amber-500/5 via-slate-900/90 to-amber-500/10 shadow-xl relative overflow-hidden print:border-amber-600 print:p-4 print:bg-white">
            
            {/* Background Festive Accents */}
            <div className="absolute top-2 left-3 text-amber-500/15 pointer-events-none select-none text-7xl font-serif">
              ✦
            </div>
            <div className="absolute top-4 right-4 text-amber-500/15 pointer-events-none select-none text-7xl font-serif">
              ★
            </div>

            {/* Header */}
            <div className="text-center space-y-2 mb-6 border-b-2 border-amber-500/40 pb-5">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-amber-400 print:text-amber-800">
                <span>كنيسة الشهيد العظيم مارمرقس</span>
                <span>فصل الأمير تادرس — مدارس الأحد</span>
                <span>العام: {academicYear}</span>
              </div>

              <div className="py-2">
                <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs sm:text-sm mb-2 shadow-sm">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>لوحة شرف الأبطال والملتزمين — {monthName}</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white print:text-slate-900 flex items-center justify-center gap-3">
                  <span>🏆</span>
                  <span>أبطال ونـجوم فصل الأمير تـادرس</span>
                  <span>⭐</span>
                </h1>
              </div>

              {/* Bible Verse */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl py-2 px-4 max-w-2xl mx-auto print:border-amber-600/40">
                <p className="text-xs sm:text-sm font-semibold text-amber-200 print:text-amber-950 font-serif italic">
                  «دَعُوا الأَوْلاَدَ يَأْتُونَ إِلَيَّ وَلاَ تَمْنَعُوهُمْ، لأَنَّ لِمِثْلِ هؤُلاَءِ مَلَكُوتَ السَّمَاوَاتِ» (متى ١٩: ١٤)
                </p>
              </div>
            </div>

            {/* Boys Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {filteredBoys.map((boy, index) => {
                const medals = ['🥇', '🥈', '🥉']
                const medal = medals[index % 3]
                const badges = [
                  'نجم الالتزام والحضور 🌟',
                  'بطل القداس والسلوك الجميل 🤍',
                  'صديق الملائكة المتميز ✨',
                  'شعلة النشاط والمحبة ❤️',
                ]
                const badgeTitle = badges[index % badges.length]

                return (
                  <div
                    key={boy.id}
                    className="flex flex-col items-center text-center p-4 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-slate-900/90 to-amber-950/30 shadow-md relative overflow-hidden group print:bg-amber-50/50 print:border-amber-400"
                  >
                    {/* Corner Ribbon / Rank */}
                    <div className="absolute top-2 start-2 text-base select-none">
                      {medal}
                    </div>

                    <div className="relative mb-3">
                      <Avatar
                        name={boy.full_name}
                        imageUrl={boy.profile_image_url}
                        size="lg"
                        className="ring-4 ring-amber-400/50 shadow-lg"
                      />
                      <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] shadow">
                        <Crown className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <h3 className="font-extrabold text-white print:text-slate-950 text-sm sm:text-base leading-snug line-clamp-1 mb-1">
                      {boy.full_name}
                    </h3>

                    <div className="flex items-center gap-1.5 mb-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[10px] font-bold border',
                          boy.kg_level === 'kg2'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 print:text-emerald-800'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/40 print:text-blue-800'
                        )}
                      >
                        {boy.kg_level === 'kg2' ? 'KG2' : 'KG1'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 print:text-amber-800">
                        {boy.check_in_count ?? 0} حضور
                      </span>
                    </div>

                    <div className="mt-auto w-full pt-2 border-t border-amber-500/20">
                      <p className="text-[11px] font-bold text-amber-300 print:text-amber-900 line-clamp-1">
                        {badgeTitle}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Official Church Endorsement Footer */}
            <div className="pt-6 border-t-2 border-amber-500/40 grid grid-cols-3 text-center text-xs sm:text-sm font-bold text-amber-300/90 print:text-slate-900">
              <div className="space-y-6">
                <p>توقيع خادم المرحلة</p>
                <p className="text-slate-500 print:text-slate-600 font-mono">.......................................</p>
              </div>
              <div className="space-y-6">
                <p>ختم واعتماد الكنيسة</p>
                <div className="w-16 h-16 border-2 border-dashed border-amber-500/50 rounded-full mx-auto flex items-center justify-center text-[10px] text-amber-500/70">
                  ختم الكنيسة
                </div>
              </div>
              <div className="space-y-6">
                <p>بركة وتوقيع أبونا كاهن الكنيسة</p>
                <p className="text-slate-500 print:text-slate-600 font-mono">.......................................</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
