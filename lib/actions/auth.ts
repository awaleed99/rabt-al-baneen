'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import type { ActionResult } from '@/lib/types'

export async function login(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, error: 'Invalid email or password. Please try again.' }
    }
    return { success: false, error: error.message }
  }

  // Check if user is using default initial password "Admin123" or has password change flag
  const isDefaultPassword =
    password === 'Admin123' || data.user?.user_metadata?.must_change_password === true

  const cookieStore = await cookies()
  if (isDefaultPassword) {
    cookieStore.set('must_change_password', 'true', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    })
    revalidatePath('/', 'layout')
    redirect('/change-password')
  } else {
    cookieStore.delete('must_change_password')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function updatePasswordAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  const newPassword = (formData.get('new_password') as string)?.trim()
  const confirmPassword = (formData.get('confirm_password') as string)?.trim()

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'كلمة المرور يجب أن لا تقل عن 6 خانات / Password must be at least 6 characters.' }
  }

  if (newPassword === 'Admin123') {
    return {
      success: false,
      error: 'لا يمكن استخدام كلمة المرور الافتراضية "Admin123". يرجى اختيار كلمة مرور شخصية جديدة.',
    }
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'كلمتا المرور غير متطابقتين / Passwords do not match.' }
  }

  // 1. Update user password and clear must_change_password in user_metadata
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
    data: {
      must_change_password: false,
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // 2. Clear must_change_password cookie
  const cookieStore = await cookies()
  cookieStore.delete('must_change_password')

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getCurrentProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}
