'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { ActionResult, Profile, UserFormData } from '@/lib/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active || profile.role !== 'admin') {
    throw new Error('Forbidden: Admins only')
  }
  return { supabase, user }
}

// ─── Get all profiles ─────────────────────────────────────────────────────────

export async function getProfiles(): Promise<Profile[]> {
  const { supabase } = await requireAdmin()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as Profile[]
}

// ─── Create user (admin creates via Supabase Admin API) ─────────────────────────

export async function createUser(formData: UserFormData): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()

    if (!formData.email || !formData.password || !formData.full_name) {
      return { success: false, error: 'Name, email, and password are required.' }
    }
    if (formData.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' }
    }

    const adminClient = createAdminClient()
    const { data, error } = await adminClient.auth.admin.createUser({
      email: formData.email.trim(),
      password: formData.password,
      email_confirm: true,
      user_metadata: {
        full_name: formData.full_name.trim(),
        role: formData.role || 'user',
      },
    })

    if (error) return { success: false, error: error.message }
    if (!data.user) return { success: false, error: 'User creation failed' }

    await adminClient
      .from('profiles')
      .upsert({
        id: data.user.id,
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        role: formData.role || 'user',
        is_active: formData.is_active ?? true,
      })

    revalidatePath('/admin')
    return { success: true, data: { id: data.user.id } }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ─── Update profile ────────────────────────────────────────────────────────────

export async function updateProfile(id: string, updates: Partial<UserFormData>): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: updates.full_name,
        role: updates.role,
        is_active: updates.is_active,
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ─── Toggle active ────────────────────────────────────────────────────────────

export async function toggleUserActive(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()

    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ─── Delete user ───────────────────────────────────────────────────────────────

export async function deleteUser(id: string): Promise<ActionResult> {
  try {
    await requireAdmin()

    const adminClient = createAdminClient()
    const { error } = await adminClient.auth.admin.deleteUser(id)
    if (error) return { success: false, error: error.message }

    // Also ensure profiles table row is removed
    await adminClient.from('profiles').delete().eq('id', id)

    revalidatePath('/admin')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ─── Update own profile ────────────────────────────────────────────────────────

export async function updateOwnProfile(updates: { full_name: string }): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: updates.full_name.trim() })
      .eq('id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/settings')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
