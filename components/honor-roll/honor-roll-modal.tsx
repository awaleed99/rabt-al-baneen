'use client'

import { useState } from 'react'
import { Trophy, Printer, Download, X, Star, Sparkles, Crown, Zap, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button-custom'
import { Avatar } from '@/components/ui/avatar-custom'
import { printHonorRollWindow } from '@/lib/export/pdf'
import { toast } from 'sonner'
import type { Boy } from '@/lib/types'
import { cn } from '@/lib/utils'

interface HonorRollModalProps {
  isOpen: boolean
  onClose: () => void
  boys: Boy[]
  academicYear?: string
  monthName?: string
}

// Rotating encouraging phrases for each child
const ENCOURAGEMENTS = [
  'أنت نجم فصلنا اللامع! ⭐',
  'بطل حقيقي بكل المقاييس! 🦁',
  'فخر فصل الأمير تادرس! 👑',
  'أنت قدوة لكل زملائك! 🌟',
  'ما شاء الله عليك يا بطل! 🎯',
  'نجاحك يسعدنا كثيراً! 🎉',
  'استمر دايماً كده يا بطل! 🚀',
  'أنت من أفضل أبطالنا! 💪',
  'شطارتك تملأ قلبنا فرحاً! ❤️',
  'ربنا يبارك فيك ويكملك! 🙏',
  'حضورك بهجة وسعادة! ✨',
  'زملائك يفتخرون بيك! 🏅',
]

const CARD_COLORS = [
  { bg: 'from-violet-600/30 to-purple-900/60', border: 'border-violet-400/60', ring: 'ring-violet-400', badge: 'bg-violet-500', text: 'text-violet-300' },
  { bg: 'from-amber-500/30 to-yellow-900/60', border: 'border-amber-400/60', ring: 'ring-amber-400', badge: 'bg-amber-500', text: 'text-amber-300' },
  { bg: 'from-emerald-600/30 to-green-900/60', border: 'border-emerald-400/60', ring: 'ring-emerald-400', badge: 'bg-emerald-500', text: 'text-emerald-300' },
  { bg: 'from-rose-600/30 to-red-900/60', border: 'border-rose-400/60', ring: 'ring-rose-400', badge: 'bg-rose-500', text: 'text-rose-300' },
  { bg: 'from-sky-500/30 to-blue-900/60', border: 'border-sky-400/60', ring: 'ring-sky-400', badge: 'bg-sky-500', text: 'text-sky-300' },
  { bg: 'from-fuchsia-600/30 to-pink-900/60', border: 'border-fuchsia-400/60', ring: 'ring-fuchsia-400', badge: 'bg-fuchsia-500', text: 'text-fuchsia-300' },
]

const RANK_EMOJIS = ['🥇', '🥈', '🥉', '🏅', '⭐', '🌟', '✨', '💫', '🎖️', '🏆']

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

  const handleDownloadPdf = () => {
    const ok = printHonorRollWindow({
      boys: filteredBoys,
      academicYear,
      monthName,
    })
    if (!ok) {
      toast.info('الرجاء الطباعة يدوياً من متصفحك')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      dir="rtl"
    >
      {/* ─── Outer Container ─────────────────────────────── */}
      <div className="relative w-full max-w-6xl my-2 flex flex-col rounded-3xl overflow-hidden shadow-2xl shadow-amber-500/10">

        {/* ─── Control Bar ───────────────────────────────── */}
        <div className="print:hidden flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-950 via-amber-950/50 to-slate-950 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg">
              <Trophy className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white leading-tight">
                لوحة شرف أبطال فصل الأمير تادرس
              </h2>
              <p className="text-[11px] text-amber-300/70">{filteredBoys.length} بطل متميز</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter */}
            <div className="hidden sm:inline-flex items-center bg-slate-900/80 border border-slate-700 rounded-xl p-1 text-xs gap-0.5">
              {(['all', 'kg1', 'kg2'] as const).map((kg) => (
                <button
                  key={kg}
                  onClick={() => setFilterKg(kg)}
                  className={cn(
                    'px-3 py-1 rounded-lg font-bold transition-all',
                    filterKg === kg
                      ? kg === 'all'
                        ? 'bg-amber-500 text-slate-950'
                        : kg === 'kg1'
                        ? 'bg-blue-600 text-white'
                        : 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {kg === 'all' ? `الكل (${boys.length})` : kg.toUpperCase()}
                </button>
              ))}
            </div>

            <Button
              onClick={handleDownloadPdf}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-md gap-1.5 text-xs px-3 py-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل PDF</span>
            </Button>

            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold gap-1.5 text-xs px-3 py-2 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── Honor Roll Sheet ───────────────────────────── */}
        <div
          id="honor-roll-sheet"
          className="bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950 overflow-y-auto max-h-[calc(100vh-80px)]"
          style={{ fontFamily: "'Cairo', sans-serif" }}
        >

          {/* Decorative floating stars background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
            {['✦','★','✧','⭐','✨','🌟'].map((s, i) => (
              <span
                key={i}
                className="absolute text-amber-500/10 font-serif animate-pulse"
                style={{
                  fontSize: `${40 + i * 18}px`,
                  top: `${8 + i * 14}%`,
                  left: `${5 + i * 16}%`,
                  animationDelay: `${i * 0.4}s`,
                }}
              >
                {s}
              </span>
            ))}
          </div>

          {/* ── Header ── */}
          <div className="relative text-center px-6 pt-8 pb-6">
            {/* Top meta line */}
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-400/80 mb-4 max-w-3xl mx-auto">
              <span>كنيسة الشهيد العظيم مارمرقس</span>
              <span>فصل الأمير تادرس · مدارس الأحد</span>
              <span>العام الدراسي {academicYear}</span>
            </div>

            {/* Main trophy icon */}
            <div className="relative inline-block mb-3">
              <div className="text-7xl sm:text-8xl animate-bounce" style={{ animationDuration: '3s' }}>
                🏆
              </div>
              <div className="absolute -top-1 -right-2 text-3xl animate-spin" style={{ animationDuration: '8s' }}>⭐</div>
              <div className="absolute -top-1 -left-2 text-2xl animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}>✨</div>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 mb-2 tracking-tight leading-tight">
              أبطال ونجوم فصلنا
            </h1>
            <p className="text-lg sm:text-2xl font-extrabold text-white/90 mb-3">
              🌟 لوحة شرف أطفال فصل الأمير تادرس — {monthName} 🌟
            </p>

            {/* Motivational banner */}
            <div className="inline-block bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/40 rounded-2xl px-6 py-2.5 max-w-2xl mx-auto">
              <p className="text-amber-200 font-bold text-sm sm:text-base" style={{ fontStyle: 'italic' }}>
                ✨ «إيه أحلى من ولاد ملتزمين ومحبوبين وفرحانين!» ✨
              </p>
            </div>

            {/* Stats badges */}
            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold">
                <Trophy className="w-3.5 h-3.5" />
                {filteredBoys.length} بطل متميز
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-extrabold">
                <Star className="w-3.5 h-3.5" />
                التزام واجتهاد
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-extrabold">
                <Heart className="w-3.5 h-3.5" />
                فخر فصلنا
              </span>
            </div>
          </div>

          {/* ── Children Cards Grid ── */}
          <div className="px-4 sm:px-8 pb-8">
            {filteredBoys.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-lg font-bold">لا يوجد أطفال في هذا الفلتر</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredBoys.map((boy, index) => {
                  const color = CARD_COLORS[index % CARD_COLORS.length]
                  const encouragement = ENCOURAGEMENTS[index % ENCOURAGEMENTS.length]
                  const rankEmoji = RANK_EMOJIS[index % RANK_EMOJIS.length]

                  return (
                    <div
                      key={boy.id}
                      className={cn(
                        'relative flex flex-col items-center text-center rounded-3xl border-2 overflow-hidden',
                        'bg-gradient-to-b', color.bg, color.border,
                        'shadow-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group'
                      )}
                    >
                      {/* Rank badge top-right */}
                      <div className="absolute top-2 right-2 text-xl select-none z-10 drop-shadow-md">
                        {rankEmoji}
                      </div>

                      {/* Rank number top-left */}
                      <div className={cn(
                        'absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold text-slate-950 z-10 shadow-md',
                        color.badge
                      )}>
                        {index + 1}
                      </div>

                      {/* Photo Section */}
                      <div className="w-full pt-8 pb-3 px-4 flex flex-col items-center">
                        <div className="relative">
                          <div className={cn('p-1 rounded-full bg-gradient-to-br', color.bg, 'shadow-xl ring-4', color.ring, 'ring-offset-2 ring-offset-slate-900')}>
                            <Avatar
                              name={boy.full_name}
                              imageUrl={boy.profile_image_url}
                              size="xl"
                              className="!w-20 !h-20 sm:!w-24 sm:!h-24 text-2xl font-extrabold"
                            />
                          </div>
                          {/* Crown overlay */}
                          <div className={cn(
                            'absolute -top-3 left-1/2 -translate-x-1/2 text-2xl drop-shadow-lg select-none',
                          )}>
                            👑
                          </div>
                          {/* Sparkle badge */}
                          <div className={cn(
                            'absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg',
                            color.badge
                          )}>
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>

                        {/* Child name */}
                        <h3 className="mt-3 font-extrabold text-white text-sm sm:text-base leading-tight line-clamp-2">
                          {boy.full_name}
                        </h3>

                        {/* KG Level + Attendance */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap justify-center">
                          <span className={cn(
                            'px-2 py-0.5 rounded-lg text-[10px] font-extrabold border',
                            boy.kg_level === 'kg2'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          )}>
                            {boy.kg_level === 'kg2' ? 'KG2' : 'KG1'}
                          </span>
                          {(boy.check_in_count ?? 0) > 0 && (
                            <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-extrabold border', color.text, 'border-current/40 bg-white/5')}>
                              {boy.check_in_count} حضور
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Encouragement footer */}
                      <div className={cn(
                        'w-full mt-auto px-3 py-2.5 border-t border-white/10',
                        'bg-black/30 backdrop-blur-sm'
                      )}>
                        <p className={cn('text-[10px] sm:text-[11px] font-extrabold leading-tight', color.text)}>
                          {encouragement}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-6 sm:px-10 pb-8 pt-2">
            <div className="border-t-2 border-amber-500/30 pt-5">
              {/* Closing motivational line */}
              <div className="text-center mb-5">
                <p className="text-amber-300/80 font-bold text-sm">
                  🌈 أحبائنا الأبطال — استمروا في التميز والالتزام وربنا يكملكم بالخير! 🌈
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center text-xs font-bold text-amber-300/70">
                <div className="space-y-3">
                  <Zap className="w-4 h-4 text-amber-400 mx-auto" />
                  <p>توقيع مسؤول المرحلة</p>
                  <p className="text-slate-500 font-mono text-[10px]">.........................................</p>
                </div>
                <div className="space-y-3">
                  <div className="w-14 h-14 border-2 border-dashed border-amber-500/40 rounded-full mx-auto flex items-center justify-center text-[9px] text-amber-500/60">
                    ختم الإدارة
                  </div>
                </div>
                <div className="space-y-3">
                  <Crown className="w-4 h-4 text-amber-400 mx-auto" />
                  <p>اعتماد المشرف العام</p>
                  <p className="text-slate-500 font-mono text-[10px]">.........................................</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
