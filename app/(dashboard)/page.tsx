import { Suspense } from 'react'
import { getDashboardStats } from '@/lib/actions/boys'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { StatCardSkeleton } from '@/components/ui/skeleton-custom'
import type { Metadata } from 'next'
import type { Profile } from '@/lib/types'

export const metadata: Metadata = {
  title: 'لوحة التحكم | Dashboard',
}

async function DashboardContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const stats = await getDashboardStats()

  return <DashboardClient stats={stats} profile={profile} />
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-8 animate-pulse">
          <div className="h-10 w-64 bg-muted rounded-xl" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <div className="h-64 bg-card border border-border rounded-2xl p-6" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
