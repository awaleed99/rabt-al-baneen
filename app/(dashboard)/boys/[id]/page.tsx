import { notFound } from 'next/navigation'
import { getBoy } from '@/lib/actions/boys'
import { getCheckIns } from '@/lib/actions/check-ins'
import { createClient } from '@/lib/supabase/server'
import { BoyProfileClient } from '@/components/boys/boy-profile-client'
import type { Metadata } from 'next'
import type { Profile } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const boy = await getBoy(id)
  return { title: boy?.full_name ?? 'ملف الولد | Profile' }
}

export const dynamic = 'force-dynamic'

export default async function BoyProfilePage({ params }: Props) {
  const { id } = await params
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

  const [boy, { data: checkIns, count }] = await Promise.all([
    getBoy(id),
    getCheckIns(id, 1, 10),
  ])

  if (!boy) notFound()

  return (
    <BoyProfileClient
      boy={boy}
      profile={profile}
      initialCheckIns={checkIns}
      checkInCount={count}
    />
  )
}
