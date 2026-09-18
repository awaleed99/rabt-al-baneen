'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, User, MapPin, Calendar, Phone, FileText, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button-custom'
import { Input, Textarea } from '@/components/ui/input-custom'
import { Avatar } from '@/components/ui/avatar-custom'
import { createBoy, updateBoy, uploadBoyImage } from '@/lib/actions/boys'
import type { Boy, BoyFormData } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

interface BoyFormProps {
  boy?: Boy
  mode: 'create' | 'edit'
}

export function BoyForm({ boy, mode }: BoyFormProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(boy?.profile_image_url ?? null)
  const [kgLevel, setKgLevel] = useState<'kg1' | 'kg2'>(boy?.kg_level ?? 'kg1')
  const [errors, setErrors] = useState<Partial<Record<keyof BoyFormData, string>>>({})

  const validate = (data: BoyFormData): boolean => {
    const newErrors: typeof errors = {}
    if (!data.full_name.trim()) {
      newErrors.full_name = language === 'ar' ? 'الاسم الكامل مطلوب.' : 'Full name is required.'
    }
    if (!data.kg_level || !['kg1', 'kg2'].includes(data.kg_level)) {
      newErrors.kg_level = language === 'ar' ? 'مرحلة الروضة (KG1 أو KG2) مطلوبة.' : 'KG level (KG1 or KG2) is required.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data: BoyFormData = {
      full_name: (form.elements.namedItem('full_name') as HTMLInputElement).value,
      kg_level: kgLevel,
      address: (form.elements.namedItem('address') as HTMLInputElement).value,
      date_of_birth: (form.elements.namedItem('date_of_birth') as HTMLInputElement).value,
      phone_number: (form.elements.namedItem('phone_number') as HTMLInputElement).value,
      notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value,
    }

    if (!validate(data)) return

    startTransition(async () => {
      let boyId = boy?.id

      if (mode === 'create') {
        const result = await createBoy(data)
        if (!result.success) { toast.error(result.error); return }
        boyId = result.data?.id
        toast.success(language === 'ar' ? 'تم إنشاء ملف الولد بنجاح!' : 'Boy profile created successfully!')
      } else if (boy) {
        const result = await updateBoy(boy.id, data)
        if (!result.success) { toast.error(result.error); return }
        toast.success(language === 'ar' ? 'تم تحديث البيانات بنجاح!' : 'Profile updated!')
      }

      // Upload image if selected
      if (imageFile && boyId) {
        const fd = new FormData()
        fd.append('image', imageFile)
        const uploadResult = await uploadBoyImage(boyId, fd)
        if (!uploadResult.success) {
          toast.warning(language === 'ar'
            ? `تم حفظ البيانات ولكن تعذر رفع الصورة: ${uploadResult.error}`
            : `Profile saved but image upload failed: ${uploadResult.error}`
          )
        }
      }

      router.push(mode === 'create' ? `/boys/${boyId}` : `/boys/${boy?.id}`)
    })
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error(language === 'ar' ? 'يُسمح فقط بصيغ JPEG, PNG, WebP, GIF' : 'Only JPEG, PNG, WebP, or GIF allowed.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'ar' ? 'الحد الأقصى لحجم الصورة هو 5 ميجابايت' : 'Image must be under 5 MB.')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-slide-up bg-card border border-border rounded-2xl p-6 sm:p-8">
      {/* Image Upload */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative group">
          <Avatar name={imagePreview ? '' : (boy?.full_name || 'Upload')} imageUrl={imagePreview} size="xl" />
          {imagePreview && (
            <button
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null) }}
              className="absolute -top-1.5 -end-1.5 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors"
              aria-label="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <label
            htmlFor="image-upload"
            className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Upload className="w-6 h-6 text-white" />
          </label>
        </div>
        <input
          id="image-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleImageChange}
          className="hidden"
        />
        <p className="text-xs text-muted-foreground">{t('photo_hint')}</p>
      </div>

      {/* Fields */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            id="full_name"
            name="full_name"
            label={t('full_name_label')}
            placeholder={t('full_name_placeholder')}
            defaultValue={boy?.full_name}
            error={errors.full_name}
            leftIcon={<User className="w-4 h-4 text-muted-foreground" />}
            required
          />
        </div>

        {/* KG Level Selection */}
        <div className="sm:col-span-2 space-y-2">
          <label className="block text-sm font-medium text-foreground">
            {t('kg_level_label')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              id="kg-level-kg1"
              onClick={() => setKgLevel('kg1')}
              className={cn(
                'flex items-center justify-between p-3.5 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer',
                kgLevel === 'kg1'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-500/20'
                  : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted/50'
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                  kgLevel === 'kg1' ? 'border-blue-600' : 'border-muted-foreground/40'
                )}>
                  {kgLevel === 'kg1' && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                </span>
                <span className="font-bold text-base">KG1</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                {language === 'ar' ? 'المرحلة الأولى' : 'Level 1'}
              </span>
            </button>

            <button
              type="button"
              id="kg-level-kg2"
              onClick={() => setKgLevel('kg2')}
              className={cn(
                'flex items-center justify-between p-3.5 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer',
                kgLevel === 'kg2'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/20'
                  : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted/50'
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                  kgLevel === 'kg2' ? 'border-emerald-600' : 'border-muted-foreground/40'
                )}>
                  {kgLevel === 'kg2' && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                </span>
                <span className="font-bold text-base">KG2</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                {language === 'ar' ? 'المرحلة الثانية' : 'Level 2'}
              </span>
            </button>
          </div>
          {errors.kg_level && <p className="text-xs text-destructive">{errors.kg_level}</p>}
        </div>

        <Input
          id="date_of_birth"
          name="date_of_birth"
          label={t('dob_label')}
          type="date"
          defaultValue={boy?.date_of_birth ?? ''}
          leftIcon={<Calendar className="w-4 h-4 text-muted-foreground" />}
        />

        <Input
          id="phone_number"
          name="phone_number"
          label={t('phone_label')}
          type="tel"
          placeholder={t('phone_placeholder')}
          defaultValue={boy?.phone_number ?? ''}
          leftIcon={<Phone className="w-4 h-4 text-muted-foreground" />}
        />

        <div className="sm:col-span-2">
          <Input
            id="address"
            name="address"
            label={t('address_label')}
            placeholder={t('address_placeholder')}
            defaultValue={boy?.address ?? ''}
            leftIcon={<MapPin className="w-4 h-4 text-muted-foreground" />}
          />
        </div>

        <div className="sm:col-span-2">
          <Textarea
            id="notes"
            name="notes"
            label={t('notes_label')}
            placeholder={t('notes_placeholder')}
            defaultValue={boy?.notes ?? ''}
            rows={4}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          {t('cancel')}
        </Button>
        <Button type="submit" isLoading={isPending}>
          {isPending
            ? t('saving')
            : (mode === 'create' ? t('save_boy_btn') : t('save'))
          }
        </Button>
      </div>
    </form>
  )
}
