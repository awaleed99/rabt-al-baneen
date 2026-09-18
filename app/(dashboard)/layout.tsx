import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Sidebar } from '@/components/layout/sidebar'
import type { Profile } from '@/lib/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const mustChange =
    cookieStore.get('must_change_password')?.value === 'true' ||
    user.user_metadata?.must_change_password === true

  if (mustChange) {
    redirect('/change-password')
  }

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    try {
      const adminClient = createAdminClient()
      const role = user.email === 'admin@rabt.app' || user.user_metadata?.role === 'admin' ? 'admin' : 'user'
      const { data: newProfile } = await adminClient
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'User'),
          email: user.email || '',
          role,
          is_active: true,
        })
        .select('*')
        .single()
      if (newProfile) profile = newProfile
    } catch (err) {
      console.error('Profile sync warning:', err)
    }
  }

  if (!profile || !profile.is_active) redirect('/login')

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar profile={profile as Profile} />
      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
