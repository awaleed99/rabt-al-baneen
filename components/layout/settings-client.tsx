'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { User, Lock, Moon, Sun, Monitor, Languages, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button-custom'
import { Input } from '@/components/ui/input-custom'
import { Avatar } from '@/components/ui/avatar-custom'
import { Badge } from '@/components/ui/badge-custom'
import { updateOwnProfile } from '@/lib/actions/users'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import type { Profile } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/context'
import { getOverdueDays } from '@/lib/utils'

interface SettingsClientProps {
  profile: Profile
}

export function SettingsClient({ profile }: SettingsClientProps) {
  const { t, language, setLanguage } = useLanguage()
  const [isPending, startTransition] = useTransition()
  const [isPwPending, startPwTransition] = useTransition()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const { theme, setTheme } = useTheme()
  const [fullName, setFullName] = useState(profile.full_name)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const overdueDays = getOverdueDays()

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateOwnProfile({ full_name: fullName })
      if (!result.success) { toast.error(result.error); return }
      toast.success(language === 'ar' ? 'تم تحديث الملف الشخصي بنجاح!' : 'Profile updated!')
    })
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error(language === 'ar' ? 'كلمات المرور غير متطابقة.' : 'Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      toast.error(language === 'ar' ? 'يجب أن لا تقل كلمة المرور عن 8 خانات.' : 'Password must be at least 8 characters.')
      return
    }
    startPwTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) { toast.error(error.message); return }
      toast.success(language === 'ar' ? 'تم تغيير كلمة المرور بنجاح!' : 'Password changed successfully!')
      setIsChangingPassword(false)
      setNewPassword(''); setConfirmPassword('')
    })
  }

  const themeOptions = [
    { value: 'light', label: t('theme_light'), icon: Sun },
    { value: 'dark', label: t('theme_dark'), icon: Moon },
    { value: 'system', label: t('theme_system'), icon: Monitor },
  ]

  return (
    <div className="space-y-8 max-w-2xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('settings_title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('settings_sub')}</p>
      </div>

      {/* Language Section */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-4 shadow-xs">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
          <Languages className="w-5 h-5 text-primary" /> {t('language_settings')}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setLanguage('ar')}
            className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 font-medium transition-all ${
              language === 'ar'
                ? 'border-primary bg-primary/10 text-primary shadow-xs'
                : 'border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            <span>🇸🇦 العربية (Arabic)</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 font-medium transition-all ${
              language === 'en'
                ? 'border-primary bg-primary/10 text-primary shadow-xs'
                : 'border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            <span>🇺🇸 English (الإنجليزية)</span>
          </button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-6 shadow-xs">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
          <User className="w-5 h-5 text-primary" /> {t('profile_settings')}
        </h2>

        <div className="flex items-center gap-4">
          <Avatar name={profile.full_name} size="lg" />
          <div>
            <p className="font-semibold text-foreground text-base">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">{profile.email}</p>
            <div className="mt-2">
              <Badge variant={profile.role === 'admin' ? 'default' : 'outline'}>
                {profile.role === 'admin' ? t('role_admin') : t('role_user')}
              </Badge>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <Input
            id="settings-name"
            label={language === 'ar' ? 'الاسم الظاهر' : 'Display Name'}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
          />
          <Input
            id="settings-email"
            label={t('email')}
            value={profile.email}
            disabled
            dir="ltr"
            className="opacity-60"
          />
          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isPending}>
              {t('save')}
            </Button>
          </div>
        </form>
      </div>

      {/* Overdue Threshold Information */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-3 shadow-xs">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-amber-500" /> {t('overdue_settings')}
        </h2>
        <p className="text-sm text-muted-foreground">{t('overdue_desc')}</p>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 font-semibold text-sm">
          <span>{overdueDays} {language === 'ar' ? 'يوماً كحد أقصى بين الزيارات' : 'days threshold'}</span>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-primary" /> {t('password')}
          </h2>
          {!isChangingPassword && (
            <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(true)}>
              {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
            </Button>
          )}
        </div>

        {isChangingPassword ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              id="new-password"
              label={language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
              type="password"
              dir="ltr"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
            <Input
              id="confirm-password"
              label={language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm New Password'}
              type="password"
              dir="ltr"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setIsChangingPassword(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" isLoading={isPwPending}>
                {language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">••••••••</p>
        )}
      </div>

      {/* Theme Section */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-4 shadow-xs">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
          <Sun className="w-5 h-5 text-primary" /> {t('appearance_settings')}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                theme === opt.value
                  ? 'border-primary bg-primary/10 text-primary shadow-xs'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              <opt.icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
