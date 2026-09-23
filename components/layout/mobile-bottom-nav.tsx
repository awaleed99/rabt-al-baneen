'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  HeartHandshake,
  Cake,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
  const pathname = usePathname()

  const navItems = [
    { label: 'الرئيسية', href: '/', icon: LayoutDashboard },
    { label: 'الأولاد', href: '/boys', icon: Users },
    { label: 'الجمعة', href: '/attendance', icon: CalendarCheck },
    { label: 'الرعاية', href: '/care', icon: HeartHandshake },
    { label: 'الميلاد', href: '/birthdays', icon: Cake },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="lg:hidden fixed bottom-3 inset-x-3 z-40 bg-slate-950/90 backdrop-blur-xl border border-slate-800/90 shadow-2xl rounded-2xl p-1.5 transition-all"
      dir="rtl"
      aria-label="التنقل السريع للجوال"
    >
      <div className="grid grid-cols-5 gap-1 text-center">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all relative',
                active
                  ? 'bg-primary/20 text-primary font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              )}
            >
              <Icon className={cn('w-5 h-5 shrink-0 transition-transform', active && 'scale-110')} />
              <span className="text-[10px] mt-1 leading-none truncate max-w-full">
                {item.label}
              </span>
              {active && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary absolute -top-0.5 shadow-xs shadow-primary" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
