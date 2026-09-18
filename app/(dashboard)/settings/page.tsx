import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/layout/settings-client'
import type { Metadata } from 'next'
import type { Profile } from '@/lib/types'

export const metadata: Metadata = {
  title: 'الإعدادات | Settings',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single()

  const profile: Profile = profileData || {
    id: user?.id ?? '',
    full_name: user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'User'),
    email: user?.email || '',
    role: (user?.user_metadata?.role === 'admin' || user?.email === 'admin@rabt.app') ? 'admin' : 'user',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return <SettingsClient profile={profile} />
}
