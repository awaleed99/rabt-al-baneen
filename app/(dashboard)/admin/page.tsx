import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfiles } from '@/lib/actions/users'
import { AdminPanelClient } from '@/components/admin/admin-panel-client'
import type { Metadata } from 'next'
import type { Profile } from '@/lib/types'

export const metadata: Metadata = { title: 'لوحة الإدارة | Admin Panel' }
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || user.user_metadata?.role === 'admin' || user.email === 'admin@rabt.app'
  if (!isAdmin) redirect('/')

  let profiles: Profile[] = []
  try {
    profiles = await getProfiles()
  } catch (err) {
    console.error('getProfiles error:', err)
  }

  return <AdminPanelClient profiles={profiles} currentUserId={user.id} />
}
