'use client'

import { useState, useTransition } from 'react'
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { formatDateTime, formatRelative, cn } from '@/lib/utils'
import { deleteCheckIn } from '@/lib/actions/check-ins'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Avatar } from '@/components/ui/avatar-custom'
import { Button } from '@/components/ui/button-custom'
import type { CheckIn } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/context'

interface CheckInHistoryProps {
  checkIns: CheckIn[]
  totalCount: number
  boyId: string
  isAdmin: boolean
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onDeleted: () => void
}

export function CheckInHistory({
  checkIns, totalCount, boyId, isAdmin, currentPage, pageSize, onPageChange, onDeleted
}: CheckInHistoryProps) {
  const { t, language, isRTL } = useLanguage()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const totalPages = Math.ceil(totalCount / pageSize)

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCheckIn(id, boyId)
      if (!result.success) { toast.error(result.error); return }
      toast.success(language === 'ar' ? 'تم حذف سجل الزيارة.' : 'Check-in deleted.')
      setDeleteTarget(null)
      onDeleted()
    })
  }

  if (checkIns.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 text-2xl">
          📋
        </div>
        <p className="font-semibold text-foreground text-base">{t('no_visits_yet')}</p>
        <p className="text-sm mt-1">{t('no_visits_yet_sub')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Timeline */}
      <div className="relative">
        {/* Vertical line with logical start */}
        <div className="absolute start-5 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-4">
          {checkIns.map((checkIn, index) => (
            <div key={checkIn.id} className="relative flex gap-4 ps-12 animate-fade-in">
              {/* Dot with logical start */}
              <div className={cn(
                'absolute start-3.5 top-4 w-3.5 h-3.5 rounded-full border-2 border-primary',
                index === 0 ? 'bg-primary ring-4 ring-primary/20' : 'bg-card'
              )} />

              <div className="flex-1 bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-primary/40 transition-colors shadow-xs">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        {formatDateTime(checkIn.visit_date)}
                      </span>
                      {index === 0 && (
                        <span className="text-xs bg-primary/15 text-primary px-2.5 py-0.5 rounded-full font-medium">
                          {language === 'ar' ? 'أحدث زيارة' : 'Most Recent'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRelative(checkIn.visit_date)}
                    </p>
                    {checkIn.notes && (
                      <p className="text-sm text-foreground mt-3 leading-relaxed bg-muted/30 p-3 rounded-lg">
                        {checkIn.notes}
                      </p>
                    )}
                    {checkIn.creator && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                        <Avatar name={checkIn.creator.full_name} size="sm" />
                        <span className="text-xs text-muted-foreground">
                          {t('visited_by')} <strong>{checkIn.creator.full_name}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(checkIn.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10 shrink-0"
                      aria-label="Delete check-in"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border flex-wrap gap-3">
          <p className="text-xs text-muted-foreground">
            {language === 'ar'
              ? `عرض ${((currentPage - 1) * pageSize) + 1}–${Math.min(currentPage * pageSize, totalCount)} من إجمالي ${totalCount} زيارة`
              : `Showing ${((currentPage - 1) * pageSize) + 1}–${Math.min(currentPage * pageSize, totalCount)} of ${totalCount} visits`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              leftIcon={isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            >
              {language === 'ar' ? 'السابق' : 'Prev'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              {language === 'ar' ? 'التالي' : 'Next'}
              {isRTL ? <ChevronLeft className="w-4 h-4 ms-1" /> : <ChevronRight className="w-4 h-4 ms-1" />}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget) }}
        title={language === 'ar' ? 'حذف سجل الزيارة' : 'Delete Check-in Record'}
        description={language === 'ar'
          ? 'هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.'
          : 'This will permanently delete this visit record. This action cannot be undone.'}
        confirmLabel={language === 'ar' ? 'تأكيد الحذف' : 'Delete Record'}
        isLoading={isPending}
      />
    </div>
  )
}
