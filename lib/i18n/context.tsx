'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { translations, Language, TranslationKey } from './translations'
import { Languages } from 'lucide-react'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
  dir: 'rtl' | 'ltr'
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'rabt_language'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default to Arabic 'ar'
  const [language, setLanguageState] = useState<Language>('ar')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null
      if (saved && (saved === 'ar' || saved === 'en')) {
        setLanguageState(saved)
      } else {
        // Default to Arabic
        setLanguageState('ar')
        localStorage.setItem(STORAGE_KEY, 'ar')
      }
    } catch {
      // Fallback
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    }
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // Ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    }
  }

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = translations[language] || translations.ar
    let text = (dict as any)[key] || (translations.ar as any)[key] || key

    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(val))
      })
    }

    return text
  }

  const dir = language === 'ar' ? 'rtl' : 'ltr'
  const isRTL = language === 'ar'

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir, isRTL }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: 'ar' as Language,
      setLanguage: () => {},
      t: (key: TranslationKey, params?: Record<string, string | number>) => {
        let text = (translations.ar as any)[key] || key
        if (params) {
          Object.entries(params).forEach(([paramKey, val]) => {
            text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(val))
          })
        }
        return text
      },
      dir: 'rtl' as const,
      isRTL: true,
    }
  }
  return context
}

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage()

  const toggle = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border bg-card hover:bg-muted transition-colors text-foreground ${className}`}
    >
      <Languages className="w-3.5 h-3.5 text-primary" />
      <span>{language === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  )
}
