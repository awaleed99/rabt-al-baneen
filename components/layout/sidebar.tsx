'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Settings, LogOut, X, Menu, Moon, Sun, Shield, Languages
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/actions/auth'
import type { Profile } from '@/lib/types'
import { useState } from 'react'
import { Avatar } from '@/components/ui/avatar-custom'
import { useLanguage } from '@/lib/i18n/context'

interface SidebarProps {
  profile: Profile
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { t, language, setLanguage, isRTL } = useLanguage()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { label: t('nav_dashboard'), href: '/', icon: LayoutDashboard },
    { label: t('nav_boys'), href: '/boys', icon: Users },
    { label: t('nav_admin'), href: '/admin', icon: Shield, adminOnly: true },
    { label: t('nav_settings'), href: '/settings', icon: Settings },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-primary flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-base">ر</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white truncate">{t('app_name')}</p>
          <p className="text-xs text-white/50 truncate">{t('app_tagline')}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems
          .filter(item => !item.adminOnly || profile.role === 'admin')
          .map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'sidebar-item',
                isActive(item.href) && 'active'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-1.5 border-t border-white/10 pt-3">
        {/* Language switch */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="sidebar-item w-full text-white/80 hover:text-white"
        >
          <Languages className="w-4 h-4 shrink-0 text-primary" />
          <span>{language === 'ar' ? 'English (EN)' : 'العربية (AR)'}</span>
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="sidebar-item w-full text-white/80 hover:text-white"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          <span>{theme === 'dark' ? t('theme_light') : t('theme_dark')}</span>
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 my-1">
          <Avatar name={profile.full_name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{profile.full_name}</p>
            <p className="text-[11px] text-teal-400 font-medium truncate">
              {profile.role === 'admin' ? t('role_admin') : t('role_user')}
            </p>
          </div>
        </div>

        {/* Logout */}
        <form action={logout}>
          <button type="submit" className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut className="w-4 h-4 shrink-0" />
            <span>{t('logout')}</span>
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-e border-white/10"
        style={{ background: 'hsl(var(--sidebar-bg))' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 start-4 z-40 p-2 rounded-xl bg-card border border-border shadow-md"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setMobileOpen(false)}
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
          <aside
            className="relative flex flex-col w-64 h-full shadow-2xl"
            style={{ background: 'hsl(var(--sidebar-bg))' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 end-4 text-white/60 hover:text-white p-1"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
