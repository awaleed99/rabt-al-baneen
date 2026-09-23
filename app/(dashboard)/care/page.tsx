import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getCareDashboardData } from '@/lib/actions/care'
import { CareClient } from '@/components/care/care-client'
import type { Metadata } from 'next'
import type { Profile } from '@/lib/types'

export const metadata: Metadata = {
  title: 'الرعاية والافتقاد الذكي | Pastoral Care',
  description: 'منظومة متابعة ورعاية وافتقاد أطفال فصل الأمير تادرس وتوزيع المخدومين على الخدام',
}

async function CarePageContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: Profile = {
    id: user?.id || '',
    full_name: user?.user_metadata?.full_name || 'خادم',
    email: user?.email || '',
    role: (user?.user_metadata?.role as any) || 'user',
    is_active: true,
    avatar_url: null,
    created_at: '',
    updated_at: '',
  }

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (data) profile = data
  }

  const initialData = await getCareDashboardData(profile.id)

  return <CareClient initialData={initialData} currentProfile={profile} />
}

export default function CarePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse" dir="rtl">
          <div className="h-10 w-72 bg-muted rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-muted rounded-2xl" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded-2xl" />
        </div>
      }
    >
      <CarePageContent />
    </Suspense>
  )
}
