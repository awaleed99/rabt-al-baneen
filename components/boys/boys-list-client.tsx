'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search, Plus, AlertCircle, Users, FileSpreadsheet, FileText, Loader2, Download
} from 'lucide-react'
import { BoyCard } from '@/components/boys/boy-card'
import { BoyCardSkeleton } from '@/components/ui/skeleton-custom'
import { Button } from '@/components/ui/button-custom'
import { Input } from '@/components/ui/input-custom'
import { getBoys } from '@/lib/actions/boys'
import { isOverdue, getOverdueDays, cn } from '@/lib/utils'
import type { Boy, SortField, SortOrder } from '@/lib/types'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/context'
import { exportBoysToExcel } from '@/lib/export/excel'
import { exportBoysToPdf, isMobileDevice } from '@/lib/export/pdf'
import { PrintRegistryModal } from '@/components/boys/print-registry-modal'
import { toast } from 'sonner'

interface BoysListClientProps {
  initialBoys: Boy[]
  isAdmin: boolean
}

export function BoysListClient({ initialBoys, isAdmin }: BoysListClientProps) {
  const { t, language, isRTL } = useLanguage()
  const searchParams = useSearchParams()

  const urlKg = searchParams.get('kg')
  const initialKg: 'all' | 'kg1' | 'kg2' =
    urlKg === 'kg1' || urlKg === 'kg2' ? urlKg : 'all'

  const [boys, setBoys] = useState<Boy[]>(initialBoys)
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [kgLevel, setKgLevel] = useState<'all' | 'kg1' | 'kg2'>(initialKg)
  const [sortField, setSortField] = useState<SortField>('full_name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)

  const overdueDays = getOverdueDays()

  const fetchBoys = useCallback(
    async (q: string, sf: SortField, so: SortOrder, kg: 'all' | 'kg1' | 'kg2') => {
      setIsLoading(true)
      try {
        const data = await getBoys(q, sf, so, kg)
        setBoys(data)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Supabase realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('boys-list-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boys' }, () => {
        fetchBoys(search, sortField, sortOrder, kgLevel)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'check_ins' }, () => {
        fetchBoys(search, sortField, sortOrder, kgLevel)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [search, sortField, sortOrder, kgLevel, fetchBoys])

  // Search debounce
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchBoys(search, sortField, sortOrder, kgLevel)
    }, 300)
    return () => clearTimeout(debounce)
  }, [search, sortField, sortOrder, kgLevel, fetchBoys])

  const filteredBoys = overdueOnly
    ? boys.filter((b) => isOverdue(b.last_check_in, overdueDays))
    : boys

  // Export handlers
  const handleExportExcel = async () => {
    if (filteredBoys.length === 0) {
      toast.warning(
        language === 'ar'
          ? 'لا توجد بيانات لتصديرها وفق الفلاتر الحالية'
          : 'No data to export with current filters'
      )
      return
    }

    setIsExportingExcel(true)
    try {
      await exportBoysToExcel({
        boys: filteredBoys,
        kgLevel,
        categoryLabel:
          kgLevel === 'kg1'
            ? 'KG1'
            : kgLevel === 'kg2'
            ? 'KG2'
            : language === 'ar'
            ? 'جميع الأولاد (الكل)'
            : 'All Boys',
      })
      toast.success(
        language === 'ar'
          ? 'تم تنزيل ملف الإكسيل بنجاح!'
          : 'Excel spreadsheet downloaded successfully!'
      )
    } catch (e: any) {
      toast.error(
        language === 'ar'
          ? `فشل تصدير الإكسيل: ${e.message}`
          : `Excel export failed: ${e.message}`
      )
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handleExportPdf = async () => {
    if (filteredBoys.length === 0) {
      toast.warning(
        language === 'ar'
          ? 'لا توجد بيانات لتصديرها وفق الفلاتر الحالية'
          : 'No data to export with current filters'
      )
      return
    }

    const isMobile = isMobileDevice()

    if (isMobile) {
      // On mobile: Open in-page registry modal directly to avoid about:blank white tab and popup blocking
      setIsPrintModalOpen(true)
      return
    }

    // On desktop: Use the dedicated native print window
    setIsExportingPdf(true)
    toast.info(
      language === 'ar'
        ? 'جاري تجهيز سجل الـ PDF الرسمي...'
        : 'Preparing official PDF registry...'
    )

    try {
      const opened = await exportBoysToPdf({
        boys: filteredBoys,
        kgLevel,
        categoryLabel:
          kgLevel === 'kg1'
            ? 'KG1'
            : kgLevel === 'kg2'
            ? 'KG2'
            : language === 'ar'
            ? 'جميع الأولاد (الكل)'
            : 'All Boys',
      })

      if (!opened) {
        // Fallback to in-page modal if popup was suppressed by browser
        setIsPrintModalOpen(true)
      } else {
        toast.success(
          language === 'ar'
            ? 'تم فتح نافذة الطباعة وسجل الـ PDF بنجاح!'
            : 'Official PDF registry window opened!'
        )
      }
    } catch (e: any) {
      // Fallback to in-page modal on any error
      setIsPrintModalOpen(true)
    } finally {
      setIsExportingPdf(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t('boys_directory')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filteredBoys.length}{' '}
            {language === 'ar' ? 'ملفات مسجلة' : 'registered profiles'}
            {kgLevel !== 'all' && (
              <span className="ms-2 font-semibold text-primary">
                ({kgLevel.toUpperCase()})
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons: Add Boy + Export Excel + Export PDF */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <Link href="/boys/new">
              <Button leftIcon={<Plus className="w-4 h-4" />}>
                {t('nav_add_boy')}
              </Button>
            </Link>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={handleExportExcel}
            disabled={isExportingExcel || filteredBoys.length === 0}
            className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50"
            leftIcon={
              isExportingExcel ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )
            }
          >
            {isExportingExcel ? t('exporting') : t('export_excel')}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleExportPdf}
            disabled={isExportingPdf || filteredBoys.length === 0}
            className="border-rose-600/30 text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50"
            leftIcon={
              isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
              ) : (
                <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              )
            }
          >
            {isExportingPdf ? t('exporting') : t('export_pdf')}
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-4">
        {/* Top filter row: Search + Sort + Overdue */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[220px]">
            <Input
              placeholder={t('search_boys_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
            />
          </div>

          <select
            className="text-sm border border-input rounded-xl px-3.5 py-2.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            value={`${sortField}:${sortOrder}`}
            onChange={(e) => {
              const [sf, so] = e.target.value.split(':') as [SortField, SortOrder]
              setSortField(sf)
              setSortOrder(so)
            }}
          >
            <option value="full_name:asc">{t('sort_name_asc')}</option>
            <option value="full_name:desc">{t('sort_name_desc')}</option>
            <option value="last_check_in:desc">{t('sort_visit_recent')}</option>
            <option value="last_check_in:asc">{t('sort_visit_oldest')}</option>
            <option value="created_at:desc">
              {language === 'ar' ? 'المضاف حديثاً' : 'Newest added'}
            </option>
            <option value="created_at:asc">
              {language === 'ar' ? 'المضاف قديماً' : 'Oldest added'}
            </option>
          </select>

          <button
            type="button"
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={cn(
              'flex items-center gap-2 text-sm px-3.5 py-2.5 rounded-xl border transition-colors cursor-pointer',
              overdueOnly
                ? 'border-amber-400 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium'
                : 'border-input bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>{t('filter_overdue')}</span>
          </button>
        </div>

        {/* KG Level Filter Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/60 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground me-1">
            {language === 'ar' ? 'تصفية المرحلة:' : 'Filter Stage:'}
          </span>

          <button
            type="button"
            onClick={() => setKgLevel('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
              kgLevel === 'all'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-muted/60 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
            )}
          >
            {t('filter_all')}
          </button>

          <button
            type="button"
            onClick={() => setKgLevel('kg1')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5',
              kgLevel === 'kg1'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                kgLevel === 'kg1' ? 'bg-white' : 'bg-blue-500'
              )}
            />
            <span>KG1</span>
          </button>

          <button
            type="button"
            onClick={() => setKgLevel('kg2')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5',
              kgLevel === 'kg2'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                kgLevel === 'kg2' ? 'bg-white' : 'bg-emerald-500'
              )}
            />
            <span>KG2</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <BoyCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredBoys.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground animate-fade-in bg-card border border-border rounded-2xl p-8">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 opacity-40 text-primary" />
          </div>
          <p className="font-semibold text-foreground text-lg">
            {t('no_boys_found')}
          </p>
          <p className="text-sm mt-1 max-w-md mx-auto">
            {search
              ? t('no_boys_search_sub')
              : isAdmin
              ? t('no_boys_empty_sub')
              : t('no_boys_empty_sub')}
          </p>
          {isAdmin && !search && (
            <Link href="/boys/new">
              <Button className="mt-5" leftIcon={<Plus className="w-4 h-4" />}>
                {t('add_first_boy')}
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBoys.map((boy) => (
            <BoyCard key={boy.id} boy={boy} />
          ))}
        </div>
      )}

      {/* Mobile-friendly and cross-platform Printable Registry Modal */}
      <PrintRegistryModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        boys={filteredBoys}
        kgLevel={kgLevel}
        categoryLabel={
          kgLevel === 'kg1'
            ? 'KG1'
            : kgLevel === 'kg2'
            ? 'KG2'
            : language === 'ar'
            ? 'جميع الأولاد (الكل)'
            : 'All Boys'
        }
      />
    </div>
  )
}
