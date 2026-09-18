'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult, CheckIn, CheckInFormData } from '@/lib/types'

async function requireActiveUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  let { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const role = (user.email === 'admin@rabt.app' || user.user_metadata?.role === 'admin') ? 'admin' : 'user'
    profile = { role, is_active: true }
  }

  if (!profile || !profile.is_active) throw new Error('Account inactive')
  return { supabase, user, profile }
}

async function requireAdmin() {
  const { supabase, user, profile } = await requireActiveUser()
  if (profile.role !== 'admin') throw new Error('Admins only')
  return { supabase, user, profile }
}

// ─── Get check-ins for a boy ─────────────────────────────────────────────────

export async function getCheckIns(boyId: string, page = 1, pageSize = 10): Promise<{ data: CheckIn[]; count: number }> {
  const { supabase } = await requireActiveUser()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('check_ins')
    .select(`*, creator:profiles!created_by(id, full_name, email)`, { count: 'exact' })
    .eq('boy_id', boyId)
    .order('visit_date', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)
  return { data: (data || []) as CheckIn[], count: count ?? 0 }
}

// ─── Create check-in ────────────────────────────────────────────────────────

export async function createCheckIn(boyId: string, formData: CheckInFormData): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, user } = await requireActiveUser()

    if (!formData.visit_date) {
      return { success: false, error: 'Visit date is required.' }
    }

    const { data, error } = await supabase
      .from('check_ins')
      .insert({
        boy_id: boyId,
        created_by: user.id,
        visit_date: formData.visit_date,
        notes: formData.notes?.trim() || null,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath(`/boys/${boyId}`)
    revalidatePath('/boys')
    revalidatePath('/')
    return { success: true, data: { id: data.id } }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ─── Update check-in (admin only) ────────────────────────────────────────────

export async function updateCheckIn(checkInId: string, boyId: string, formData: CheckInFormData): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()

    const { error } = await supabase
      .from('check_ins')
      .update({
        visit_date: formData.visit_date,
        notes: formData.notes?.trim() || null,
      })
      .eq('id', checkInId)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/boys/${boyId}`)
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ─── Delete check-in (admin only) ────────────────────────────────────────────

export async function deleteCheckIn(checkInId: string, boyId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()

    const { error } = await supabase.from('check_ins').delete().eq('id', checkInId)
    if (error) return { success: false, error: error.message }

    revalidatePath(`/boys/${boyId}`)
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
