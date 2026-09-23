import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BoyForm } from '@/components/boys/boy-form'
import { getActiveServants } from '@/lib/actions/boys'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'إضافة ولد جديد | Add Boy',
}

export default async function NewBoyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id ?? '')
    .single()

  const isAdmin = profile?.role === 'admin' || user?.user_metadata?.role === 'admin' || user?.email === 'admin@rabt.app'
  if (!isAdmin) redirect('/boys')

  const servants = await getActiveServants()

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">إضافة ولد جديد | Add New Boy</h1>
        <p className="text-muted-foreground text-sm mt-1">أدخل بيانات الولد لإنشاء ملف المتابعة الجديد</p>
      </div>
      <BoyForm mode="create" servants={servants} />
    </div>
  )
}
