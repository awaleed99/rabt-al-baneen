'use client'

import { useState, useTransition } from 'react'
import {
  X,
  UserCheck,
  Sparkles,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button-custom'
import { Avatar } from '@/components/ui/avatar-custom'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Boy, Profile } from '@/lib/types'
import { assignBoyToServant, autoDistributeBoysToServants } from '@/lib/actions/care'

interface ServantAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  boys: Boy[]
  servants: Profile[]
  onDataChange: (updatedBoys: Boy[]) => void
}

export function ServantAssignmentModal({
  isOpen,
  onClose,
  boys: initialBoys,
  servants,
  onDataChange,
}: ServantAssignmentModalProps) {
  const [boys, setBoys] = useState<Boy[]>(initialBoys)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'unassigned' | 'kg1' | 'kg2' | string>('all')
  const [isPending, startTransition] = useTransition()
  const [autoDistributing, setAutoDistributing] = useState(false)

  if (!isOpen) return null

  // Calculate servant boy counts
  const servantBoyCounts = new Map<string, number>()
  for (const s of servants) {
    servantBoyCounts.set(s.id, 0)
  }
  let unassignedCount = 0
  for (const b of boys) {
    if (b.assigned_servant_id && servantBoyCounts.has(b.assigned_servant_id)) {
      servantBoyCounts.set(b.assigned_servant_id, (servantBoyCounts.get(b.assigned_servant_id) || 0) + 1)
    } else {
      unassignedCount++
    }
  }

  // Filter boys
  const filteredBoys = boys.filter((b) => {
    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const matchName = b.full_name.toLowerCase().includes(q)
      const matchPhone = (b.father_phone || b.mother_phone || b.phone_number || '').includes(q)
      if (!matchName && !matchPhone) return false
    }

    // Filter
    if (filterType === 'unassigned') {
      return !b.assigned_servant_id
    }
    if (filterType === 'kg1') {
      return (b.kg_level || '').toLowerCase() === 'kg1'
    }
    if (filterType === 'kg2') {
      return (b.kg_level || '').toLowerCase() === 'kg2'
    }
    if (filterType !== 'all') {
      // It's a specific servant ID
      return b.assigned_servant_id === filterType
    }

    return true
  })

  // Assign boy to servant
  const handleAssign = (boyId: string, servantId: string | null) => {
    startTransition(async () => {
      const res = await assignBoyToServant(boyId, servantId)
      if (res.success) {
        const assignedServant = servants.find((s) => s.id === servantId)
        const updated = boys.map((b) =>
          b.id === boyId
            ? {
                ...b,
                assigned_servant_id: servantId,
                assigned_servant: assignedServant
                  ? { id: assignedServant.id, full_name: assignedServant.full_name, email: assignedServant.email }
                  : undefined,
              }
            : b
        )
        setBoys(updated)
        onDataChange(updated)
        const boyName = boys.find((b) => b.id === boyId)?.full_name || 'الولد'
        if (servantId && assignedServant) {
          toast.success(`تم تعيين ${assignedServant.full_name} مسؤولاً عن ${boyName} بنجاح! 🤍`)
        } else {
          toast.info(`تم إلغاء تعيين الخادم عن ${boyName}`)
        }
      } else {
        toast.error(`تعذر التعيين: ${res.error}`)
      }
    })
  }

  // Smart Auto-Distribute
  const handleAutoDistribute = (unassignedOnly = true) => {
    setAutoDistributing(true)
    startTransition(async () => {
      const res = await autoDistributeBoysToServants(unassignedOnly)
      setAutoDistributing(false)
      if (res.success) {
        const count = res.data?.assignedCount || 0
        toast.success(`⚡ تم التوزيع الآلي بنجاح! تم توزيع ${count} ولد بالتساوي على الخدام. ✨`)
        // Optimistically redistribute locally
        let nextIndex = 0
        const updated = boys.map((b) => {
          if (unassignedOnly && b.assigned_servant_id) return b
          const targetServant = servants[nextIndex % servants.length]
          nextIndex++
          return {
            ...b,
            assigned_servant_id: targetServant.id,
            assigned_servant: {
              id: targetServant.id,
              full_name: targetServant.full_name,
              email: targetServant.email,
            },
          }
        })
        setBoys(updated)
        onDataChange(updated)
      } else {
        toast.error(`تعذر التوزيع: ${res.error}`)
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-inner">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                <span>توزيع الأطفال على الخدام</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {boys.length} ولد • {servants.length} خادم
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تخصيص خادم مسؤول لكل طفل للمتابعة المستمرة والافتقاد الدوري
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Servants Load Summary Grid */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>لوحة الخدام ومعدلات التوزيع (اضغط على خادم لفلترة أولاده):</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {unassignedCount === 0 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    جميع الأولاد موزعون بنجاح!
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {unassignedCount} ولد بدون خادم مسؤول
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {servants.map((servant) => {
                const count = servantBoyCounts.get(servant.id) || 0
                const isSelected = filterType === servant.id

                return (
                  <button
                    key={servant.id}
                    type="button"
                    onClick={() => setFilterType(isSelected ? 'all' : servant.id)}
                    className={cn(
                      'p-2.5 rounded-xl border text-right transition-all flex items-center gap-2.5 group relative overflow-hidden',
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-200'
                    )}
                  >
                    <Avatar name={servant.full_name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate group-hover:text-emerald-400 transition-colors">
                        {servant.full_name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        <span className={cn('font-bold', count > 0 ? 'text-emerald-400' : 'text-slate-500')}>
                          {count}
                        </span>{' '}
                        مخدوم
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Smart Auto-Distribute Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-800/80 to-blue-950/60 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 text-center sm:text-right">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">
                  التوزيع الآلي الذكي والمتكافئ ⚡
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  توزيع {unassignedCount > 0 ? `الـ ${unassignedCount} أولاد غير المسندين` : 'جميع الأولاد'} بالتساوي على الخدام المسجلين بنقرة زر واحدة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {unassignedCount > 0 && (
                <Button
                  onClick={() => handleAutoDistribute(true)}
                  disabled={autoDistributing || isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md gap-1.5"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', autoDistributing && 'animate-spin')} />
                  <span>توزيع غير المسندين ({unassignedCount})</span>
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => handleAutoDistribute(false)}
                disabled={autoDistributing || isPending}
                className="border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 font-bold text-xs px-3 py-2 rounded-xl"
                title="إعادة توزيع جميع الأولاد بالتساوي من جديد"
              >
                <span>إعادة توزيع الكل بالتساوي 🔄</span>
              </Button>
            </div>
          </div>

          {/* Boys List Section */}
          <div className="space-y-3">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={cn(
                    'px-3 py-1 rounded-xl text-xs font-bold transition-all',
                    filterType === 'all'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  )}
                >
                  الكل ({boys.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('unassigned')}
                  className={cn(
                    'px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1',
                    filterType === 'unassigned'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                  )}
                >
                  <span>بدون خادم</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 font-mono">
                    {unassignedCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('kg1')}
                  className={cn(
                    'px-3 py-1 rounded-xl text-xs font-bold transition-all',
                    filterType === 'kg1'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  )}
                >
                  KG1
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('kg2')}
                  className={cn(
                    'px-3 py-1 rounded-xl text-xs font-bold transition-all',
                    filterType === 'kg2'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  )}
                >
                  KG2
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث باسم الولد..."
                  className="w-full sm:w-56 ps-9 pe-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Boys Rows */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80 bg-slate-900/60">
              {filteredBoys.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <p className="text-sm font-bold">لا يوجد أولاد مطابقين لهذا البحث</p>
                  <p className="text-xs text-slate-500">جرب تغيير الفلتر أو مسح كلمة البحث</p>
                </div>
              ) : (
                filteredBoys.map((boy) => {
                  return (
                    <div
                      key={boy.id}
                      className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Boy Info */}
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={boy.full_name}
                          imageUrl={boy.profile_image_url}
                          size="md"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-sm">
                              {boy.full_name}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded-md border',
                                boy.kg_level === 'kg2'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              )}
                            >
                              {boy.kg_level === 'kg2' ? 'KG2' : 'KG1'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {boy.father_phone || boy.mother_phone || 'لا يوجد هاتف مسجل'}
                          </p>
                        </div>
                      </div>

                      {/* Servant Selector */}
                      <div className="flex items-center gap-2 shrink-0 justify-end">
                        <div className="text-right">
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            الخادم المسؤول:
                          </label>
                          <select
                            value={boy.assigned_servant_id || ''}
                            onChange={(e) => handleAssign(boy.id, e.target.value || null)}
                            disabled={isPending}
                            className={cn(
                              'text-xs font-bold py-1.5 px-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary min-w-[170px]',
                              boy.assigned_servant_id
                                ? 'bg-slate-800 border-emerald-500/40 text-emerald-300'
                                : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                            )}
                          >
                            <option value="" className="bg-slate-900 text-slate-400">
                              ⚠️ بدون خادم مسؤول
                            </option>
                            {servants.map((s) => (
                              <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                                {s.full_name} ({servantBoyCounts.get(s.id) || 0} أولاد)
                              </option>
                            ))}
                          </select>
                        </div>

                        {boy.assigned_servant_id && (
                          <button
                            type="button"
                            onClick={() => handleAssign(boy.id, null)}
                            disabled={isPending}
                            title="إلغاء التعيين"
                            className="p-1.5 mt-4 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <span>نسبة التوزيع الحالية: </span>
            <span className="font-extrabold text-white">
              {boys.length - unassignedCount} من {boys.length} ولد ({Math.round(((boys.length - unassignedCount) / (boys.length || 1)) * 100)}%)
            </span>
          </div>

          <Button
            onClick={onClose}
            className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-6 py-2 rounded-xl"
          >
            تم الانتهاء ✓
          </Button>
        </div>
      </div>
    </div>
  )
}
