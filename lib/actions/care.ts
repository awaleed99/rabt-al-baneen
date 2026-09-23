'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBoys } from '@/lib/actions/boys'
import { getOverdueDays } from '@/lib/utils'
import type {
  ActionResult,
  Boy,
  CareDashboardData,
  CheckIn,
  PastoralAlert,
  Profile,
  VisitationType,
} from '@/lib/types'

async function requireActiveUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const role =
      user.email === 'admin@rabt.app' || user.user_metadata?.role === 'admin'
        ? 'admin'
        : 'user'
    profile = { id: user.id, role, is_active: true, full_name: user.user_metadata?.full_name || 'خادم', email: user.email || '' } as Profile
  }

  if (!profile || !profile.is_active) {
    throw new Error('Forbidden: Account inactive')
  }
  return { supabase, user, profile }
}

function parseAssignedServantId(boy: any): string | null {
  if (boy?.assigned_servant_id) return boy.assigned_servant_id
  if (boy?.notes) {
    const match = boy.notes.match(/\[(?:ASSIGNED_TO|خادم_مسؤول):\s*([a-f0-9-]+)\]/i)
    if (match) return match[1].trim()
  }
  return null
}

function parseVisitationType(notes: string | null, directType?: string | null): VisitationType {
  if (directType && ['call', 'home', 'church', 'health', 'general'].includes(directType)) {
    return directType as VisitationType
  }
  if (notes) {
    const match = notes.match(/\[TYPE:(\w+)\]/i)
    if (match && ['call', 'home', 'church', 'health', 'general'].includes(match[1].toLowerCase())) {
      return match[1].toLowerCase() as VisitationType
    }
  }
  return 'general'
}

/**
 * Fetches dashboard data for Pastoral Care & Visitation
 */
export async function getCareDashboardData(servantFilterId?: string): Promise<CareDashboardData> {
  const { supabase, profile } = await requireActiveUser()

  // 1. Fetch active servants
  const { data: servantsData } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, avatar_url, created_at, updated_at')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  const servants: Profile[] = (servantsData || []) as Profile[]
  const servantMap = new Map<string, Profile>()
  for (const s of servants) {
    servantMap.set(s.id, s)
  }

  // 2. Fetch all boys
  const rawBoys = await getBoys('', 'full_name', 'asc', 'all')
  const allBoys: Boy[] = rawBoys.map((b) => {
    const assignedId = parseAssignedServantId(b)
    const assignedProfile = assignedId ? servantMap.get(assignedId) : undefined
    return {
      ...b,
      assigned_servant_id: assignedId,
      assigned_servant: assignedProfile
        ? { id: assignedProfile.id, full_name: assignedProfile.full_name, email: assignedProfile.email }
        : undefined,
    }
  })

  // 3. Fetch recent attendance records (last 4 Fridays) to detect consecutive absences
  const recentFridays: string[] = []
  const today = new Date()
  for (let i = 0; i < 40; i++) {
    const d = new Date()
    d.setDate(today.getDate() - i)
    if (d.getDay() === 5) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!recentFridays.includes(dateStr)) {
        recentFridays.push(dateStr)
      }
      if (recentFridays.length >= 4) break
    }
  }

  const attendanceMap: Record<string, Record<string, string>> = {} // boyId -> date -> status
  if (recentFridays.length > 0) {
    try {
      const { data: attRecords } = await supabase
        .from('attendance')
        .select('boy_id, date, status')
        .in('date', recentFridays)

      if (attRecords) {
        for (const rec of attRecords) {
          if (!attendanceMap[rec.boy_id]) attendanceMap[rec.boy_id] = {}
          attendanceMap[rec.boy_id][rec.date] = rec.status
        }
      }
    } catch {
      // fallback
    }

    // Also check check_ins notes fallback
    try {
      const { data: ciRecords } = await supabase
        .from('check_ins')
        .select('boy_id, notes')
        .ilike('notes', '%[ATTENDANCE:%')

      for (const rec of ciRecords || []) {
        if (rec.notes) {
          const match = rec.notes.match(/\[ATTENDANCE:(\d{4}-\d{2}-\d{2}):(\w+)\]/)
          if (match) {
            const [, dateStr, status] = match
            if (recentFridays.includes(dateStr)) {
              if (!attendanceMap[rec.boy_id]) attendanceMap[rec.boy_id] = {}
              attendanceMap[rec.boy_id][dateStr] = status
            }
          }
        }
      }
    } catch {
      // fallback
    }
  }

  // 4. Compute Urgent Pastoral Alerts
  const urgentAlerts: PastoralAlert[] = []
  const overdueDays = getOverdueDays()
  const nowTime = today.getTime()

  for (const boy of allBoys) {
    const boyAtt = attendanceMap[boy.id] || {}

    // Check consecutive absences in recent Fridays
    let consecutiveAbsences = 0
    for (const friDate of recentFridays) {
      const status = boyAtt[friDate]
      if (status === 'absent') {
        consecutiveAbsences++
      } else if (status === 'present') {
        break // streak broken
      }
    }

    if (consecutiveAbsences >= 2) {
      urgentAlerts.push({
        boy,
        reason: 'consecutive_absences',
        consecutiveAbsencesCount: consecutiveAbsences,
        descriptionAr: `غائب لـ ${consecutiveAbsences} جمع متتالية بدون عذر`,
        descriptionEn: `Absent for ${consecutiveAbsences} consecutive Fridays`,
      })
      continue
    }

    // Check overdue visits (> 30 days or never)
    if (!boy.last_check_in) {
      urgentAlerts.push({
        boy,
        reason: 'never_visited',
        descriptionAr: 'لم يتم افتقاده أو تسجيل زيارة له من قبل',
        descriptionEn: 'Never visited or contacted yet',
      })
    } else {
      const diffDays = Math.floor((nowTime - new Date(boy.last_check_in).getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays >= overdueDays) {
        urgentAlerts.push({
          boy,
          reason: 'no_visit_long',
          daysSinceLastVisit: diffDays,
          descriptionAr: `مر ${diffDays} يوماً منذ آخر افتقاد (أكثر من ${overdueDays} يوم)`,
          descriptionEn: `${diffDays} days without visitation (over ${overdueDays} days)`,
        })
      }
    }
  }

  // 5. Query check-ins of current month
  const currentMonthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01T00:00:00Z`
  const { data: monthVisits } = await supabase
    .from('check_ins')
    .select('id, boy_id, created_by, visit_date, notes, created_at, updated_at, creator:profiles!created_by(id, full_name, email), boy:boys(id, full_name, profile_image_url, kg_level)')
    .gte('visit_date', currentMonthStart)
    .order('visit_date', { ascending: false })
    .limit(20)

  const recentVisitations = (monthVisits || []).map((v: any) => ({
    ...v,
    visitation_type: parseVisitationType(v.notes, v.visitation_type),
  }))

  // 6. Filter assigned boys if servant filter is requested
  const targetServantId = servantFilterId || profile.id
  const assignedBoys = allBoys.filter((b) => b.assigned_servant_id === targetServantId)
  const assignedCount = allBoys.filter((b) => Boolean(b.assigned_servant_id)).length
  const unassignedCount = allBoys.length - assignedCount

  return {
    allBoys,
    assignedBoys,
    urgentAlerts,
    servants,
    recentVisitations,
    stats: {
      totalBoys: allBoys.length,
      assignedCount,
      unassignedCount,
      urgentCount: urgentAlerts.length,
      visitsThisMonth: monthVisits?.length || 0,
    },
  }
}

/**
 * Assigns or reassigns a boy to a specific servant
 */
export async function assignBoyToServant(
  boyId: string,
  servantId: string | null
): Promise<ActionResult> {
  try {
    const { supabase } = await requireActiveUser()

    // 1. Try updating column assigned_servant_id directly
    const { error } = await supabase
      .from('boys')
      .update({ assigned_servant_id: servantId })
      .eq('id', boyId)

    if (error && (error.code === '42703' || error.message.includes('assigned_servant_id'))) {
      // Fallback: pack inside notes
      const { data: boy } = await supabase.from('boys').select('notes').eq('id', boyId).single()
      let notes = (boy?.notes || '').replace(/\[(?:ASSIGNED_TO|خادم_مسؤول):\s*[^\]]+\]/gi, '').trim()
      if (servantId) {
        notes = `${notes ? notes + ' ' : ''}[ASSIGNED_TO:${servantId}]`
      }
      await supabase.from('boys').update({ notes }).eq('id', boyId)
    } else if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/care')
    revalidatePath('/boys')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Automatically distributes boys evenly across active servants
 * If unassignedOnly is true, only distributes boys without an assigned servant.
 * If false, redistributes all boys evenly.
 */
export async function autoDistributeBoysToServants(
  unassignedOnly = true
): Promise<ActionResult<{ assignedCount: number }>> {
  try {
    const { supabase } = await requireActiveUser()

    // 1. Fetch active servants
    const { data: servants } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('is_active', true)
      .order('full_name', { ascending: true })

    if (!servants || servants.length === 0) {
      return { success: false, error: 'لا يوجد خدام نشطين مسجلين في النظام حالياً' }
    }

    // 2. Fetch boys
    const { data: boysData, error: boysErr } = await supabase
      .from('boys')
      .select('id, notes')

    if (boysErr || !boysData) {
      return { success: false, error: boysErr?.message || 'تعذر جلب بيانات الأطفال' }
    }

    const boysToAssign = boysData.filter((b) => {
      if (!unassignedOnly) return true
      const assignedId = parseAssignedServantId(b)
      return !assignedId
    })

    if (boysToAssign.length === 0) {
      return { success: true, data: { assignedCount: 0 } }
    }

    // 3. Round-robin assign across servants
    let count = 0
    for (let i = 0; i < boysToAssign.length; i++) {
      const boy = boysToAssign[i]
      const targetServant = servants[i % servants.length]

      // Try column update
      const { error: colErr } = await supabase
        .from('boys')
        .update({ assigned_servant_id: targetServant.id })
        .eq('id', boy.id)

      if (colErr && (colErr.code === '42703' || colErr.message.includes('assigned_servant_id'))) {
        let notes = (boy.notes || '').replace(/\[(?:ASSIGNED_TO|خادم_مسؤول):\s*[^\]]+\]/gi, '').trim()
        notes = `${notes ? notes + ' ' : ''}[ASSIGNED_TO:${targetServant.id}]`
        await supabase.from('boys').update({ notes }).eq('id', boy.id)
      }
      count++
    }

    revalidatePath('/care')
    revalidatePath('/boys')
    revalidatePath('/')
    return { success: true, data: { assignedCount: count } }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Records a new pastoral care visitation (call, home visit, church encounter, etc.)
 */
export async function recordPastoralVisit(
  boyId: string,
  visitDate: string,
  visitationType: VisitationType,
  notes: string
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireActiveUser()

    const taggedNotes = `[TYPE:${visitationType}] ${notes.trim()}`

    // Try inserting with visitation_type column
    const { error } = await supabase.from('check_ins').insert({
      boy_id: boyId,
      created_by: user.id,
      visit_date: visitDate ? `${visitDate}T10:00:00Z` : new Date().toISOString(),
      visitation_type: visitationType,
      notes: taggedNotes,
    })

    if (error && (error.code === '42703' || error.message.includes('visitation_type'))) {
      // Fallback without column
      await supabase.from('check_ins').insert({
        boy_id: boyId,
        created_by: user.id,
        visit_date: visitDate ? `${visitDate}T10:00:00Z` : new Date().toISOString(),
        notes: taggedNotes,
      })
    } else if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/care')
    revalidatePath('/boys')
    revalidatePath(`/boys/${boyId}`)
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
