'use client'

import { useState, useTransition } from 'react'
import { Eye, EyeOff, Mail, Lock, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button-custom'
import { Input } from '@/components/ui/input-custom'
import { login } from '@/lib/actions/auth'
import { useLanguage, LanguageToggle } from '@/lib/i18n/context'

export default function LoginPage() {
  const { t, language } = useLanguage()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      setError(t('login_error_empty'))
      return
    }

    startTransition(async () => {
      try {
        const result = await login(formData)
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
      {/* Top language bar */}
      <div className="flex justify-end mb-3">
        <LanguageToggle />
      </div>

      {/* Card */}
      <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Header stripe */}
        <div className="bg-gradient-to-r from-teal-700 via-primary to-blue-700 px-8 py-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl">
              ر
            </div>
            <div>
              <h1 className="text-xl font-bold">{t('app_name')}</h1>
              <p className="text-white/80 text-xs">{t('app_tagline')}</p>
            </div>
          </div>
          <p className="text-white/90 text-sm mt-4">{t('login_sub')}</p>
        </div>

        {/* Form */}
        <div className="px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              id="email"
              name="email"
              label={t('email')}
              type="email"
              placeholder={t('login_email_placeholder')}
              autoComplete="email"
              required
              dir="ltr"
              leftIcon={<Mail className="w-4 h-4 text-muted-foreground" />}
            />

            <Input
              id="password"
              name="password"
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('login_password_placeholder')}
              autoComplete="current-password"
              required
              dir="ltr"
              leftIcon={<Lock className="w-4 h-4 text-muted-foreground" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 animate-fade-in">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" isLoading={isPending}>
              {isPending ? t('signing_in') : t('sign_in')}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            {language === 'ar'
              ? 'تواصل مع مدير النظام إذا كنت بحاجة إلى حساب وصول جديد.'
              : 'Contact your administrator if you need system access.'}
          </p>
        </div>
      </div>
    </div>
  )
}
