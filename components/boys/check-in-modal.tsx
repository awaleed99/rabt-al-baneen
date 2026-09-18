'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button-custom'
import { Input, Textarea } from '@/components/ui/input-custom'
import { createCheckIn } from '@/lib/actions/check-ins'
import { format } from 'date-fns'
import { useLanguage } from '@/lib/i18n/context'

interface CheckInModalProps {
  boyId: string
  boyName: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CheckInModal({ boyId, boyName, isOpen, onClose, onSuccess }: CheckInModalProps) {
  const { t, language } = useLanguage()
  const [isPending, startTransition] = useTransition()
  const [dateError, setDateError] = useState('')

  if (!isOpen) return null

  const todayLocal = format(new Date(), "yyyy-MM-dd'T'HH:mm")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setDateError('')
    const form = e.currentTarget
    const visitDate = (form.elements.namedItem('visit_date') as HTMLInputElement).value
    const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement).value

    if (!visitDate) {
      setDateError(language === 'ar' ? 'تاريخ ووقت الزيارة مطلوب.' : 'Visit date and time is required.')
      return
    }

    startTransition(async () => {
      const result = await createCheckIn(boyId, { visit_date: new Date(visitDate).toISOString(), notes })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(language === 'ar' ? 'تم تسجيل الزيارة بنجاح!' : 'Check-in recorded successfully!')
      onSuccess()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-7 animate-slide-up">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 end-4 text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">{t('checkin_modal_title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {language === 'ar' ? 'تسجيل ومتابعة لـ: ' : 'Recording a visit for: '}
            <strong className="text-foreground">{boyName}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="visit_date"
            name="visit_date"
            label={t('checkin_date_label')}
            type="datetime-local"
            defaultValue={todayLocal}
            error={dateError}
            leftIcon={<Calendar className="w-4 h-4 text-muted-foreground" />}
            dir="ltr"
          />

          <Textarea
            id="notes"
            name="notes"
            label={t('checkin_notes_label')}
            placeholder={t('checkin_notes_placeholder')}
            rows={4}
          />

          <div className="flex gap-3 justify-end pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              {t('cancel')}
            </Button>
            <Button type="submit" isLoading={isPending}>
              {isPending ? t('saving') : t('submit_checkin')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
