import { notFound, redirect } from 'next/navigation'
import { getBoy } from '@/lib/actions/boys'
import { createClient } from '@/lib/supabase/server'
import { BoyForm } from '@/components/boys/boy-form'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'تعديل البيانات | Edit Boy',
}

export default async function EditBoyPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id ?? '')
    .single()

  const isAdmin = profile?.role === 'admin' || user?.user_metadata?.role === 'admin' || user?.email === 'admin@rabt.app'
  if (!isAdmin) redirect(`/boys/${id}`)

  const boy = await getBoy(id)
  if (!boy) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">تعديل ملف الولد | Edit Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">{boy.full_name}</p>
      </div>
      <BoyForm boy={boy} mode="edit" />
    </div>
  )
}
