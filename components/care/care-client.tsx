'use client'

import { useState, useTransition } from 'react'
import {
  HeartHandshake,
  AlertTriangle,
  Users,
  PhoneCall,
  UserCheck,
  Search,
  Phone,
  MessageCircle,
  PlusCircle,
  Calendar,
  X,
  CheckCircle2,
  Trophy,
  FileText,
  Clock,
  Home,
  Church,
  Stethoscope,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button-custom'
import { Avatar } from '@/components/ui/avatar-custom'
import { Badge } from '@/components/ui/badge-custom'
import { assignBoyToServant, recordPastoralVisit } from '@/lib/actions/care'
import { formatRelative, cn } from '@/lib/utils'
import { cleanPhoneNumber } from '@/lib/birthday'
import { HonorRollModal } from '@/components/honor-roll/honor-roll-modal'
import { PriestReportModal } from '@/components/reports/priest-report-modal'
import type {
  Boy,
  CareDashboardData,
  PastoralAlert,
  Profile,
  VisitationType,
} from '@/lib/types'

interface CareClientProps {
  initialData: CareDashboardData
  currentProfile: Profile
}

export function CareClient({ initialData, currentProfile }: CareClientProps) {
  const [data, setData] = useState<CareDashboardData>(initialData)
  const [activeTab, setActiveTab] = useState<'my' | 'all' | 'unassigned' | 'urgent'>('my')
  const [selectedServantId, setSelectedServantId] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [kgFilter, setKgFilter] = useState<'all' | 'kg1' | 'kg2'>('all')

  // Modals
  const [isHonorRollOpen, setIsHonorRollOpen] = useState(false)
  const [isPriestReportOpen, setIsPriestReportOpen] = useState(false)
  const [selectedBoyForVisit, setSelectedBoyForVisit] = useState<Boy | null>(null)
  const [visitDate, setVisitDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [visitType, setVisitType] = useState<VisitationType>('call')
  const [visitNotes, setVisitNotes] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  // Filter boys
  const filteredBoys = data.allBoys.filter((boy) => {
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchName = boy.full_name.toLowerCase().includes(q)
      const matchPhone =
        (boy.father_phone || '').includes(q) || (boy.mother_phone || '').includes(q)
      if (!matchName && !matchPhone) return false
    }

    // KG Level filter
    if (kgFilter !== 'all' && boy.kg_level !== kgFilter) {
      return false
    }

    // Tab filter
    if (activeTab === 'my') {
      return boy.assigned_servant_id === currentProfile.id
    }
    if (activeTab === 'unassigned') {
      return !boy.assigned_servant_id
    }
    if (activeTab === 'urgent') {
      return data.urgentAlerts.some((a) => a.boy.id === boy.id)
    }

    // Specific servant filter in 'all' tab
    if (selectedServantId !== 'all') {
      return boy.assigned_servant_id === selectedServantId
    }

    return true
  })

  // Handle assigning servant
  const handleAssignServant = async (boyId: string, servantId: string | null) => {
    startTransition(async () => {
      const res = await assignBoyToServant(boyId, servantId)
      if (res.success) {
        toast.success('تم تحديث الخادم المسؤول بنجاح')
        const servant = data.servants.find((s) => s.id === servantId)
        setData((prev) => ({
          ...prev,
          allBoys: prev.allBoys.map((b) =>
            b.id === boyId
              ? {
                  ...b,
                  assigned_servant_id: servantId,
                  assigned_servant: servant
                    ? { id: servant.id, full_name: servant.full_name, email: servant.email }
                    : undefined,
                }
              : b
          ),
          assignedBoys: prev.assignedBoys.map((b) =>
            b.id === boyId
              ? {
                  ...b,
                  assigned_servant_id: servantId,
                  assigned_servant: servant
                    ? { id: servant.id, full_name: servant.full_name, email: servant.email }
                    : undefined,
                }
              : b
          ),
        }))
      } else {
        toast.error(`تعذر التعيين: ${res.error}`)
      }
    })
  }

  // Handle recording pastoral visit
  const handleSaveVisit = async () => {
    if (!selectedBoyForVisit) return

    startTransition(async () => {
      const res = await recordPastoralVisit(
        selectedBoyForVisit.id,
        visitDate,
        visitType,
        visitNotes
      )
      if (res.success) {
        toast.success(`تم تسجيل الافتقاد لحبيبنا ${selectedBoyForVisit.full_name} بنجاح! 🤍`)
        setSelectedBoyForVisit(null)
        setVisitNotes('')
        // Optimistically update last check in
        setData((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            visitsThisMonth: prev.stats.visitsThisMonth + 1,
            urgentCount: prev.urgentAlerts.filter((a) => a.boy.id !== selectedBoyForVisit.id).length,
          },
          urgentAlerts: prev.urgentAlerts.filter((a) => a.boy.id !== selectedBoyForVisit.id),
          allBoys: prev.allBoys.map((b) =>
            b.id === selectedBoyForVisit.id
              ? { ...b, last_check_in: visitDate, check_in_count: (b.check_in_count || 0) + 1 }
              : b
          ),
        }))
      } else {
        toast.error(`تعذر حفظ الافتقاد: ${res.error}`)
      }
    })
  }

  // Get WhatsApp pastoral greeting message
  const getPastoralWhatsAppUrl = (phone: string | null | undefined, boyName: string) => {
    const clean = cleanPhoneNumber(phone)
    if (!clean) return '#'
    const text = `تحية طيبة وخالص التقدير 🤍
نحب نطمن على حبيبنا البطل ${boyName} وكل الأسرة الكريمة من إدارة فصل الأمير تادرس ✨
نتمنى لكم دوام الصحة والخير ونسعد دائماً برؤيته ومتابعته المستمرة معنا! 🕊️`
    return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <HeartHandshake className="w-6 h-6" />
            </span>
            <span>الرعاية والافتقاد الذكي</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            كنيسة مارمرقس — فصل الأمير تادرس (توزيع المخدومين، تنبيهات الغياب المتكرر، ومتابعة الافتقاد)
          </p>
        </div>

        {/* Action Buttons: Priest Report & Honor Roll */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setIsPriestReportOpen(true)}
            className="border-primary/40 hover:bg-primary/10 text-primary font-bold gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>التقرير الشهري الشامل 📋</span>
          </Button>

          <Button
            onClick={() => setIsHonorRollOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold gap-2 shadow-md shadow-amber-500/15"
          >
            <Trophy className="w-4 h-4" />
            <span>لوحة الشرف للأطفال 🏆</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
            <span>إجمالي المخدومين</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-extrabold text-foreground font-mono">
            {data.stats.totalBoys} <span className="text-xs font-normal text-muted-foreground">ولد</span>
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
            <span>موزعون على خدام</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {data.stats.assignedCount} <span className="text-xs font-normal text-muted-foreground">({data.stats.unassignedCount} بدون خادم)</span>
          </p>
        </div>

        <div className="bg-card border border-rose-500/30 bg-rose-500/5 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs mb-1 font-bold">
            <span>يحتاجون افتقاد عاجل ⚠️</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
            {data.urgentAlerts.length} <span className="text-xs font-normal">ولد</span>
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
            <span>افتقادات هذا الشهر</span>
            <PhoneCall className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 font-mono">
            {data.stats.visitsThisMonth} <span className="text-xs font-normal text-muted-foreground">تواصل</span>
          </p>
        </div>
      </div>

      {/* Urgent Alerts Banner Section (If any) */}
      {data.urgentAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border-2 border-rose-500/40 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500 text-white font-bold animate-pulse">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h2 className="font-extrabold text-foreground text-base sm:text-lg">
                تنبيهات الغياب المتكرر والافتقاد العاجل ({data.urgentAlerts.length} أولاد)
              </h2>
            </div>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-bold hidden sm:inline">
              يُرجى الاطمئنان عليهم تليفونياً أو منزلياً
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.urgentAlerts.slice(0, 6).map((alert) => (
              <div
                key={alert.boy.id}
                className="bg-card/90 border border-rose-500/30 rounded-2xl p-3.5 flex flex-col justify-between shadow-xs gap-3"
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    name={alert.boy.full_name}
                    imageUrl={alert.boy.profile_image_url}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-foreground text-sm truncate">{alert.boy.full_name}</h4>
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                      ⚠️ {alert.descriptionAr}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      الخادم: {alert.boy.assigned_servant?.full_name || 'غير محدد بعد'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-border/60">
                  {(alert.boy.father_phone || alert.boy.mother_phone) && (
                    <>
                      <a
                        href={`tel:${alert.boy.father_phone || alert.boy.mother_phone}`}
                        className="flex-1 py-1 px-2 rounded-lg bg-muted text-center text-xs font-bold text-foreground hover:bg-muted/80 flex items-center justify-center gap-1"
                        title="اتصال هاتفي"
                      >
                        <Phone className="w-3 h-3 text-primary" />
                        <span>اتصال</span>
                      </a>
                      <a
                        href={getPastoralWhatsAppUrl(alert.boy.father_phone || alert.boy.mother_phone, alert.boy.full_name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1"
                        title="افتقاد واتساب"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedBoyForVisit(alert.boy)
                      setVisitDate(new Date().toISOString().split('T')[0])
                    }}
                    className="text-xs font-bold py-1 px-2.5 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                  >
                    تسجيل افتقاد
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border rounded-2xl p-3 shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('my')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
              activeTab === 'my'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <span>أولادي المسندين لي</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              {data.allBoys.filter((b) => b.assigned_servant_id === currentProfile.id).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
              activeTab === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <span>كل الأولاد ({data.allBoys.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('unassigned')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
              activeTab === 'unassigned'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <span>بدون خادم ({data.stats.unassignedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('urgent')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
              activeTab === 'urgent'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <span>يحتاجون افتقاد ({data.urgentAlerts.length})</span>
          </button>
        </div>

        {/* Right Filters: Servant, KG, Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Servant Selector if on 'all' tab */}
          {activeTab === 'all' && (
            <select
              value={selectedServantId}
              onChange={(e) => setSelectedServantId(e.target.value)}
              className="bg-muted border border-border rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none"
            >
              <option value="all">كل الخدام</option>
              {data.servants.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          )}

          {/* KG Level */}
          <div className="inline-flex items-center bg-muted rounded-xl p-1 text-xs">
            <button
              onClick={() => setKgFilter('all')}
              className={cn('px-2.5 py-0.5 rounded-lg font-bold', kgFilter === 'all' && 'bg-card text-foreground shadow-xs')}
            >
              الكل
            </button>
            <button
              onClick={() => setKgFilter('kg1')}
              className={cn('px-2.5 py-0.5 rounded-lg font-bold', kgFilter === 'kg1' && 'bg-blue-600 text-white shadow-xs')}
            >
              KG1
            </button>
            <button
              onClick={() => setKgFilter('kg2')}
              className={cn('px-2.5 py-0.5 rounded-lg font-bold', kgFilter === 'kg2' && 'bg-emerald-600 text-white shadow-xs')}
            >
              KG2
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الهاتف..."
              className="ps-8 pe-3 py-1.5 rounded-xl bg-muted border border-border text-xs w-36 sm:w-44 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Boys Pastoral Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredBoys.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-card border border-border rounded-2xl">
            <HeartHandshake className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-bold text-sm">لا يوجد أولاد مطابقين لهذا التصنيف حالياً</p>
          </div>
        ) : (
          filteredBoys.map((boy) => {
            const hasUrgent = data.urgentAlerts.find((a) => a.boy.id === boy.id)
            const fatherPhone = boy.father_phone || boy.phone_number
            const motherPhone = boy.mother_phone

            return (
              <div
                key={boy.id}
                className={cn(
                  'bg-card border rounded-2xl p-4.5 flex flex-col justify-between shadow-xs transition-all hover:shadow-md relative overflow-hidden',
                  hasUrgent ? 'border-rose-500/40 bg-rose-500/5' : 'border-border'
                )}
              >
                {/* Header */}
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar
                      name={boy.full_name}
                      imageUrl={boy.profile_image_url}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-foreground truncate text-base">
                          {boy.full_name}
                        </h3>
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0',
                            boy.kg_level === 'kg2'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30'
                          )}
                        >
                          {boy.kg_level === 'kg2' ? 'KG2' : 'KG1'}
                        </span>
                      </div>

                      {hasUrgent ? (
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-1">
                          ⚠️ {hasUrgent.descriptionAr}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {boy.last_check_in
                              ? `آخر افتقاد: ${formatRelative(boy.last_check_in)}`
                              : 'لم يُفتقد بعد'}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Assigned Servant Row */}
                  <div className="flex items-center justify-between text-xs py-2 px-2.5 rounded-xl bg-muted/60 border border-border/60 mb-3">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-primary" />
                      <span>الخادم المسؤول:</span>
                    </span>

                    <select
                      value={boy.assigned_servant_id || ''}
                      onChange={(e) => handleAssignServant(boy.id, e.target.value || null)}
                      className="bg-card text-foreground font-bold text-xs py-1 px-2 rounded-lg border border-border/80 focus:outline-none focus:ring-1 focus:ring-primary max-w-[140px] truncate"
                    >
                      <option value="">(غير محدد)</option>
                      {data.servants.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Parents Contact Shortcuts */}
                  {(fatherPhone || motherPhone) && (
                    <div className="space-y-1.5 mb-3">
                      {fatherPhone && (
                        <div className="flex items-center justify-between text-xs bg-muted/40 px-2 py-1 rounded-lg">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <span>👨</span>
                            <span>الأب:</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${fatherPhone}`}
                              className="font-mono text-primary hover:underline text-[11px]"
                            >
                              {fatherPhone}
                            </a>
                            <a
                              href={getPastoralWhatsAppUrl(fatherPhone, boy.full_name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-500"
                              title="محادثة واتساب"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}

                      {motherPhone && (
                        <div className="flex items-center justify-between text-xs bg-muted/40 px-2 py-1 rounded-lg">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <span>👩</span>
                            <span>الأم:</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${motherPhone}`}
                              className="font-mono text-primary hover:underline text-[11px]"
                            >
                              {motherPhone}
                            </a>
                            <a
                              href={getPastoralWhatsAppUrl(motherPhone, boy.full_name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-500"
                              title="محادثة واتساب"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer action button */}
                <div className="pt-2 border-t border-border/60">
                  <Button
                    onClick={() => {
                      setSelectedBoyForVisit(boy)
                      setVisitDate(new Date().toISOString().split('T')[0])
                    }}
                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs gap-1.5 justify-center py-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>تسجيل افتقاد جديد 📝</span>
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Record Pastoral Visit Modal */}
      {selectedBoyForVisit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          dir="rtl"
        >
          <div className="bg-card border border-border rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="font-extrabold text-foreground text-lg flex items-center gap-2">
                  <span>تسجيل افتقاد جديد</span>
                  <span>🤍</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  المخدوم: <strong className="text-foreground">{selectedBoyForVisit.full_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedBoyForVisit(null)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visit Date */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                تاريخ الافتقاد:
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Visitation Type Selector */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-2">
                نوع الافتقاد:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisitType('call')}
                  className={cn(
                    'p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all',
                    visitType === 'call'
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted'
                  )}
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>📞 مكالمة هاتفية</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisitType('home')}
                  className={cn(
                    'p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all',
                    visitType === 'home'
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Home className="w-4 h-4" />
                  <span>🏠 زيارة منزلية</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisitType('church')}
                  className={cn(
                    'p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all',
                    visitType === 'church'
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Church className="w-4 h-4" />
                  <span>⛪ لقاء بالكنيسة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisitType('health')}
                  className={cn(
                    'p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all',
                    visitType === 'health'
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>🩺 متابعة صحية</span>
                </button>
              </div>
            </div>

            {/* Notes Textarea */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                ملاحظات الافتقاد:
              </label>
              <textarea
                rows={3}
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                placeholder="اكتب خلاصة المكالمة أو الزيارة (مثال: تم الاطمئنان عليه، كان مسافراً مع الأسرة وسيصل الجمعة القادمة)..."
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handleSaveVisit}
                disabled={isPending}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold"
              >
                {isPending ? 'جاري الحفظ...' : 'حفظ الافتقاد ✅'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedBoyForVisit(null)}
                className="px-4"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Honor Roll Modal */}
      <HonorRollModal
        isOpen={isHonorRollOpen}
        onClose={() => setIsHonorRollOpen(false)}
        boys={data.allBoys}
      />

      {/* Priest Report Modal */}
      <PriestReportModal
        isOpen={isPriestReportOpen}
        onClose={() => setIsPriestReportOpen(false)}
      />
    </div>
  )
}
