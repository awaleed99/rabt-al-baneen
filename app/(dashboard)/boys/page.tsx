import { getBoys } from '@/lib/actions/boys'
import { createClient } from '@/lib/supabase/server'
import { BoysListClient } from '@/components/boys/boys-list-client'
import type { Metadata } from 'next'
import type { Boy } from '@/lib/types'

export const metadata: Metadata = {
  title: 'سجل البنين | Boys Directory',
}
export const dynamic = 'force-dynamic'

export default async function BoysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id ?? '')
    .single()

  let boys: Boy[] = []
  try {
    boys = await getBoys()
  } catch (err) {
    console.error('getBoys error:', err)
  }

  const isAdmin = profile?.role === 'admin' || user?.user_metadata?.role === 'admin' || user?.email === 'admin@rabt.app'

  return <BoysListClient initialBoys={boys} isAdmin={isAdmin} />
}
