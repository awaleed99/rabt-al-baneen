'use client'

import { useState, useTransition } from 'react'
import { Eye, EyeOff, Lock, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button-custom'
import { Input } from '@/components/ui/input-custom'
import { updatePasswordAction, logout } from '@/lib/actions/auth'
import { useLanguage, LanguageToggle } from '@/lib/i18n/context'

export default function ChangePasswordPage() {
  const { t, language, isRTL } = useLanguage()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    const newPassword = (formData.get('new_password') as string)?.trim()
    const confirmPassword = (formData.get('confirm_password') as string)?.trim()

    if (!newPassword || !confirmPassword) {
      setError(
        language === 'ar'
          ? 'يرجى إدخال كلمة المرور الجديدة وتأكيدها.'
          : 'Please enter and confirm your new password.'
      )
      return
    }

    if (newPassword.length < 6) {
      setError(
        language === 'ar'
          ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام.'
          : 'Password must be at least 6 characters long.'
      )
      return
    }

    if (newPassword === 'Admin123') {
      setError(
        language === 'ar'
          ? 'لا يمكن استخدام كلمة المرور الافتراضية "Admin123". يرجى اختيار كلمة مرور جديدة خاصة بك.'
          : 'You cannot reuse the default password "Admin123". Please choose a new unique password.'
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setError(
        language === 'ar'
          ? 'كلمة المرور وتأكيدها غير متطابقين.'
          : 'Passwords do not match.'
      )
      return
    }

    startTransition(async () => {
      try {
        const result = await updatePasswordAction(formData)
        if (result && !result.success && result.error) {
          setError(result.error)
        }
      } catch (err: any) {
        if (err.message && !err.message.includes('NEXT_REDIRECT')) {
          setError(err.message)
        }
      }
    })
  }

  return (
    <div className="w-full max-w-md animate-slide-up">
      {/* Top bar with language switcher */}
      <div className="flex justify-end mb-3">
        <LanguageToggle />
      </div>

      {/* Card */}
      <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Header stripe */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-primary px-8 py-7 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
              </h1>
              <p className="text-white/80 text-xs">
                {language === 'ar'
                  ? 'إجراء أمني إلزامي للحساب'
                  : 'Mandatory security step'}
              </p>
            </div>
          </div>
          <p className="text-white/95 text-xs sm:text-sm mt-3 leading-relaxed">
            {language === 'ar'
              ? 'أنت تستخدم كلمة المرور الافتراضية (Admin123). لحماية بيانات الخدمة، يجب تعيين كلمة مرور شخصية خاصة بك للمتابعة إلى النظام.'
              : 'You are using the default password (Admin123). To protect ministry data, please set your personal password to proceed.'}
          </p>
        </div>

        {/* Form Body */}
        <div className="px-8 py-7">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              id="new_password"
              name="new_password"
              label={
                language === 'ar'
                  ? 'كلمة المرور الجديدة *'
                  : 'New Password *'
              }
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              dir="ltr"
              leftIcon={<Lock className="w-4 h-4 text-muted-foreground" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="hover:text-foreground transition-colors p-1 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            <Input
              id="confirm_password"
              name="confirm_password"
              label={
                language === 'ar'
                  ? 'تأكيد كلمة المرور الجديدة *'
                  : 'Confirm New Password *'
              }
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              dir="ltr"
              leftIcon={<Lock className="w-4 h-4 text-muted-foreground" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="hover:text-foreground transition-colors p-1 cursor-pointer"
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 animate-fade-in flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive leading-normal">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isPending}
            >
              {isPending
                ? language === 'ar'
                  ? 'جاري حفظ كلمة المرور...'
                  : 'Saving password...'
                : language === 'ar'
                ? 'حفظ كلمة المرور والدخول للنظام'
                : 'Save Password & Enter'}
            </Button>
          </form>

          {/* Logout button */}
          <div className="mt-6 pt-5 border-t border-border text-center">
            <button
              type="button"
              onClick={() => logout()}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>
                {language === 'ar'
                  ? 'تسجيل الخروج والرجوع'
                  : 'Sign out and return'}
              </span>
              {isRTL ? (
                <ArrowRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
