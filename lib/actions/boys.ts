'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { ActionResult, Boy, BoyFormData, DashboardStats, Profile } from '@/lib/types'
import { getOverdueDays } from '@/lib/utils'
import { isTodayBirthday, isBirthdayThisWeek } from '@/lib/birthday'

// ─── Guard helper ────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  let { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile && (user.email === 'admin@rabt.app' || user.user_metadata?.role === 'admin')) {
    profile = { role: 'admin', is_active: true }
  }

  if (!profile || !profile.is_active || profile.role !== 'admin') {
    throw new Error('Forbidden: Admins only')
  }
  return { supabase, user, profile }
}

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

  if (!profile || !profile.is_active) {
    throw new Error('Forbidden: Account inactive')
  }
  return { supabase, user, profile }
}

function parseMotherPhone(boy: any): string | null {
  if (boy?.mother_phone) return boy.mother_phone
  if (boy?.notes) {
    const match = boy.notes.match(/\[(?:هاتف الأم|MOTHER_PHONE):\s*(.*?)\]/)
    if (match) return match[1].trim()
  }
  return null
}

function parseAssignedServantId(boy: any): string | null {
  if (boy?.assigned_servant_id) return boy.assigned_servant_id
  if (boy?.notes) {
    const match = boy.notes.match(/\[(?:ASSIGNED_TO|خادم_مسؤول):\s*([a-f0-9-]+)\]/i)
    if (match) return match[1].trim()
  }
  return null
}

export async function getActiveServants(): Promise<Profile[]> {
  const { supabase } = await requireActiveUser()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, avatar_url, created_at, updated_at')
    .eq('is_active', true)
    .order('full_name', { ascending: true })
  return (data || []) as Profile[]
}

// ─── Get all boys with last check-in ────────────────────────────────────────

export async function getBoys(
  search = '',
  sortField = 'full_name',
  sortOrder: 'asc' | 'desc' = 'asc',
  kgLevel: 'all' | 'kg1' | 'kg2' = 'all'
) {
  const { supabase } = await requireActiveUser()

  let query = supabase
    .from('boys')
    .select(`
      *,
      creator:profiles!created_by(id, full_name, email),
      check_ins(visit_date)
    `)

  if (search.trim()) {
    query = query.ilike('full_name', `%${search.trim()}%`)
  }

  if (kgLevel && kgLevel !== 'all') {
    query = query.eq('kg_level', kgLevel)
  }

  if (sortField === 'full_name') {
    query = query.order('full_name', { ascending: sortOrder === 'asc' })
  } else {
    query = query.order('created_at', { ascending: sortOrder === 'asc' })
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)


  // Compute last_check_in and check_in_count in JS
  const boys: Boy[] = (data || []).map((boy: any) => {
    const dates = (boy.check_ins || []).map((c: any) => c.visit_date).filter(Boolean)
    const lastCheckIn = dates.length > 0
      ? dates.reduce((a: string, b: string) => (a > b ? a : b))
      : null
    return {
      ...boy,
      father_phone: boy.father_phone || boy.phone_number || null,
      mother_phone: parseMotherPhone(boy),
      assigned_servant_id: parseAssignedServantId(boy),
      check_ins: undefined,
      last_check_in: lastCheckIn,
      check_in_count: dates.length,
    }
  })

  // Sort by last_check_in if needed
  if (sortField === 'last_check_in') {
    boys.sort((a, b) => {
      const aDate = a.last_check_in ?? ''
      const bDate = b.last_check_in ?? ''
      return sortOrder === 'asc' ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate)
    })
  }

  return boys
}

// ─── Get single boy ──────────────────────────────────────────────────────────

export async function getBoy(id: string): Promise<Boy | null> {
  const { supabase } = await requireActiveUser()

  const { data, error } = await supabase
    .from('boys')
    .select(`
      *,
      creator:profiles!created_by(id, full_name, email)
    `)
    .eq('id', id)
    .single()

  if (error) return null

  // Get check-in stats separately
  const { data: checkInsData } = await supabase
    .from('check_ins')
    .select('visit_date')
    .eq('boy_id', id)

  const dates = (checkInsData || []).map((c) => c.visit_date).filter(Boolean)
  const lastCheckIn = dates.length > 0
    ? dates.reduce((a, b) => (a > b ? a : b))
    : null

  return {
    ...data,
    father_phone: data.father_phone || data.phone_number || null,
    mother_phone: parseMotherPhone(data),
    assigned_servant_id: parseAssignedServantId(data),
    last_check_in: lastCheckIn,
    check_in_count: dates.length,
  }
}

// ─── Create boy ──────────────────────────────────────────────────────────────

export async function createBoy(formData: BoyFormData): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, user } = await requireAdmin()

    const fatherPhone = (formData.father_phone || formData.phone_number || '').trim() || null
    const motherPhone = (formData.mother_phone || '').trim() || null

    const basePayload: any = {
      full_name: formData.full_name.trim(),
      kg_level: formData.kg_level || 'kg1',
      address: formData.address?.trim() || null,
      date_of_birth: formData.date_of_birth || null,
      phone_number: fatherPhone,
      notes: formData.notes?.trim() || null,
      created_by: user.id,
    }

    if (formData.assigned_servant_id) {
      basePayload.assigned_servant_id = formData.assigned_servant_id
    }

    // Attempt insert with father_phone, mother_phone, and assigned_servant_id columns
    let res = await supabase
      .from('boys')
      .insert({
        ...basePayload,
        father_phone: fatherPhone,
        mother_phone: motherPhone,
      })
      .select('id')
      .single()

    // If columns don't exist yet in Supabase schema, fallback to inserting without them
    if (res.error && (res.error.message.includes('father_phone') || res.error.message.includes('mother_phone') || res.error.message.includes('assigned_servant_id'))) {
      let fallbackNotes = basePayload.notes || ''
      if (motherPhone) {
        fallbackNotes = `${fallbackNotes ? fallbackNotes + '\n' : ''}[هاتف الأم: ${motherPhone}]`
      }
      if (formData.assigned_servant_id) {
        fallbackNotes = `${fallbackNotes ? fallbackNotes + '\n' : ''}[ASSIGNED_TO:${formData.assigned_servant_id}]`
      }

      delete basePayload.assigned_servant_id
      res = await supabase
        .from('boys')
        .insert({
          ...basePayload,
          notes: fallbackNotes || null,
        })
        .select('id')
        .single()
    }

    if (res.error) return { success: false, error: res.error.message }

    revalidatePath('/boys')
    revalidatePath('/')
    return { success: true, data: { id: res.data.id } }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ─── Update boy ──────────────────────────────────────────────────────────────

export async function updateBoy(id: string, formData: BoyFormData): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()

    const fatherPhone = (formData.father_phone || formData.phone_number || '').trim() || null
    const motherPhone = (formData.mother_phone || '').trim() || null

    const basePayload: any = {
      full_name: formData.full_name.trim(),
      kg_level: formData.kg_level || 'kg1',
      address: formData.address?.trim() || null,
      date_of_birth: formData.date_of_birth || null,
      phone_number: fatherPhone,
      notes: formData.notes?.trim() || null,
    }

    if (formData.assigned_servant_id !== undefined) {
      basePayload.assigned_servant_id = formData.assigned_servant_id || null
    }

    let res = await supabase
      .from('boys')
      .update({
        ...basePayload,
        father_phone: fatherPhone,
        mother_phone: motherPhone,
      })
      .eq('id', id)

    if (res.error && (res.error.message.includes('father_phone') || res.error.message.includes('mother_phone') || res.error.message.includes('assigned_servant_id'))) {
      let fallbackNotes = (basePayload.notes || '').replace(/\[(?:ASSIGNED_TO|خادم_مسؤول):\s*[^\]]+\]/gi, '').trim()
      if (motherPhone) {
        fallbackNotes = `${fallbackNotes ? fallbackNotes + '\n' : ''}[هاتف الأم: ${motherPhone}]`
      }
      if (formData.assigned_servant_id) {
        fallbackNotes = `${fallbackNotes ? fallbackNotes + '\n' : ''}[ASSIGNED_TO:${formData.assigned_servant_id}]`
      }

      delete basePayload.assigned_servant_id
      res = await supabase
        .from('boys')
        .update({
          ...basePayload,
          notes: fallbackNotes || null,
        })
        .eq('id', id)
    }

    if (res.error) return { success: false, error: res.error.message }

    revalidatePath('/boys')
    revalidatePath(`/boys/${id}`)
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ─── Delete boy ──────────────────────────────────────────────────────────────

export async function deleteBoy(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()

    const { error } = await supabase.from('boys').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/boys')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ─── Upload profile image ─────────────────────────────────────────────────────

export async function uploadBoyImage(boyId: string, file: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    const { supabase } = await requireAdmin()

    const imageFile = file.get('image') as File
    if (!imageFile) return { success: false, error: 'No image provided' }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(imageFile.type)) {
      return { success: false, error: 'Invalid file type. Use JPEG, PNG, WebP, or GIF.' }
    }
    if (imageFile.size > 5 * 1024 * 1024) {
      return { success: false, error: 'Image too large. Maximum size is 5 MB.' }
    }

    const ext = imageFile.name.split('.').pop()
    const path = `boys/${boyId}/profile.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('boy-images')
      .upload(path, imageFile, { upsert: true })

    if (uploadError) return { success: false, error: uploadError.message }

    const { data: { publicUrl } } = supabase.storage
      .from('boy-images')
      .getPublicUrl(path)

    const { error: updateError } = await supabase
      .from('boys')
      .update({ profile_image_url: publicUrl })
      .eq('id', boyId)

    if (updateError) return { success: false, error: updateError.message }

    revalidatePath(`/boys/${boyId}`)
    revalidatePath('/boys')
    return { success: true, data: { url: publicUrl } }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const { supabase } = await requireActiveUser()
  const overdueDays = getOverdueDays()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const overdueThreshold = new Date(Date.now() - overdueDays * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalBoys },
    { count: kg1Count },
    { count: kg2Count },
    { count: totalCheckIns },
    { count: recentCheckIns },
    { data: boysWithLastCheckIn },
    { count: activeUsers },
    { data: recentCheckInsList },
    { data: allBoysForBirthdays },
  ] = await Promise.all([
    supabase.from('boys').select('*', { count: 'exact', head: true }),
    supabase.from('boys').select('*', { count: 'exact', head: true }).eq('kg_level', 'kg1'),
    supabase.from('boys').select('*', { count: 'exact', head: true }).eq('kg_level', 'kg2'),
    supabase.from('check_ins').select('*', { count: 'exact', head: true }),
    supabase.from('check_ins').select('*', { count: 'exact', head: true }).gte('visit_date', sevenDaysAgo),
    supabase.from('boys').select('id, check_ins(visit_date)'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('check_ins')
      .select(`*, boy:boys(id, full_name, profile_image_url), creator:profiles!created_by(id, full_name, email)`)
      .order('visit_date', { ascending: false })
      .limit(5),
    supabase.from('boys').select('id, full_name, profile_image_url, date_of_birth, kg_level, phone_number, notes'),
  ])

  // Count overdue boys
  const overdueCount = (boysWithLastCheckIn || []).filter((boy: any) => {
    const dates = (boy.check_ins || []).map((c: any) => c.visit_date).filter(Boolean)
    if (dates.length === 0) return true
    const lastDate = dates.reduce((a: string, b: string) => (a > b ? a : b))
    return lastDate < overdueThreshold
  }).length

  // Calculate birthdays
  const todayBirthdays: Boy[] = []
  const weekBirthdays: Boy[] = []

  for (const b of allBoysForBirthdays || []) {
    if (isTodayBirthday(b.date_of_birth)) {
      todayBirthdays.push({
        ...b,
        father_phone: (b as any).father_phone || b.phone_number || null,
        mother_phone: parseMotherPhone(b),
      } as Boy)
    } else if (isBirthdayThisWeek(b.date_of_birth)) {
      weekBirthdays.push({
        ...b,
        father_phone: (b as any).father_phone || b.phone_number || null,
        mother_phone: parseMotherPhone(b),
      } as Boy)
    }
  }

  return {
    totalBoys: totalBoys ?? 0,
    kg1Count: kg1Count ?? 0,
    kg2Count: kg2Count ?? 0,
    totalCheckIns: totalCheckIns ?? 0,
    recentCheckIns: recentCheckIns ?? 0,
    overdueCount,
    activeUsers: activeUsers ?? 0,
    recentCheckInsList: (recentCheckInsList || []) as any,
    todayBirthdays,
    weekBirthdays,
  }
}
