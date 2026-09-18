'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Plus, AlertCircle, Users } from 'lucide-react'
import { BoyCard } from '@/components/boys/boy-card'
import { BoyCardSkeleton } from '@/components/ui/skeleton-custom'
import { Button } from '@/components/ui/button-custom'
import { Input } from '@/components/ui/input-custom'
import { getBoys } from '@/lib/actions/boys'
import { isOverdue, getOverdueDays } from '@/lib/utils'
import type { Boy, SortField, SortOrder } from '@/lib/types'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/context'

interface BoysListClientProps {
  initialBoys: Boy[]
  isAdmin: boolean
}

export function BoysListClient({ initialBoys, isAdmin }: BoysListClientProps) {
  const { t, language } = useLanguage()
  const searchParams = useSearchParams()
  const [boys, setBoys] = useState<Boy[]>(initialBoys)
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [sortField, setSortField] = useState<SortField>('full_name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const overdueDays = getOverdueDays()

  const fetchBoys = useCallback(async (q: string, sf: SortField, so: SortOrder) => {
    setIsLoading(true)
    try {
      const data = await getBoys(q, sf, so)
      setBoys(data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Supabase realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('boys-list-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boys' }, () => {
        fetchBoys(search, sortField, sortOrder)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'check_ins' }, () => {
        fetchBoys(search, sortField, sortOrder)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [search, sortField, sortOrder, fetchBoys])

  useEffect(() => {
    const debounce = setTimeout(() => { fetchBoys(search, sortField, sortOrder) }, 300)
    return () => clearTimeout(debounce)
  }, [search, sortField, sortOrder, fetchBoys])

  const filteredBoys = overdueOnly ? boys.filter(b => isOverdue(b.last_check_in, overdueDays)) : boys

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('boys_directory')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {boys.length} {language === 'ar' ? 'ملفات مسجلة' : 'registered profiles'}
          </p>
        </div>
        {isAdmin && (
          <Link href="/boys/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>{t('nav_add_boy')}</Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[220px] max-w-sm">
          <Input
            placeholder={t('search_boys_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
          />
        </div>

        <select
          className="text-sm border border-input rounded-xl px-3.5 py-2.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          value={`${sortField}:${sortOrder}`}
          onChange={e => {
            const [sf, so] = e.target.value.split(':') as [SortField, SortOrder]
            setSortField(sf); setSortOrder(so)
          }}
        >
          <option value="full_name:asc">{t('sort_name_asc')}</option>
          <option value="full_name:desc">{t('sort_name_desc')}</option>
          <option value="last_check_in:desc">{t('sort_visit_recent')}</option>
          <option value="last_check_in:asc">{t('sort_visit_oldest')}</option>
          <option value="created_at:desc">{language === 'ar' ? 'المضاف حديثاً' : 'Newest added'}</option>
          <option value="created_at:asc">{language === 'ar' ? 'المضاف قديماً' : 'Oldest added'}</option>
        </select>

        <button
          type="button"
          onClick={() => setOverdueOnly(!overdueOnly)}
          className={`flex items-center gap-2 text-sm px-3.5 py-2.5 rounded-xl border transition-colors ${
            overdueOnly
              ? 'border-amber-400 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium'
              : 'border-input bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span>{t('filter_overdue')}</span>
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <BoyCardSkeleton key={i} />)}
        </div>
      ) : filteredBoys.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground animate-fade-in bg-card border border-border rounded-2xl p-8">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 opacity-40 text-primary" />
          </div>
          <p className="font-semibold text-foreground text-lg">{t('no_boys_found')}</p>
          <p className="text-sm mt-1 max-w-md mx-auto">
            {search ? t('no_boys_search_sub') : isAdmin ? t('no_boys_empty_sub') : t('no_boys_empty_sub')}
          </p>
          {isAdmin && !search && (
            <Link href="/boys/new">
              <Button className="mt-5" leftIcon={<Plus className="w-4 h-4" />}>{t('add_first_boy')}</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBoys.map(boy => <BoyCard key={boy.id} boy={boy} />)}
        </div>
      )}
    </div>
  )
}
