'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBoys } from '@/lib/actions/boys'
import type {
  ActionResult,
  AttendanceStatus,
  Boy,
  BoyAttendanceRow,
  FridayInfo,
  MonthlyAttendanceData,
} from '@/lib/types'

import {
  ARABIC_MONTHS,
  ENGLISH_MONTHS,
  getFridaysOfMonth,
} from '@/lib/attendance-utils'

/**
 * Guard helper: ensure active user session
 */
async function requireActiveUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  let { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const role =
      user.email === 'admin@rabt.app' || user.user_metadata?.role === 'admin'
        ? 'admin'
        : 'user'
    profile = { role, is_active: true }
  }

  if (!profile || !profile.is_active) {
    throw new Error('Forbidden: Account inactive')
  }
  return { supabase, user, profile }
}

/**
 * Fetches monthly attendance data for all boys
 */
export async function getMonthlyAttendance(
  year: number,
  month: number,
  kgLevel: 'all' | 'kg1' | 'kg2' = 'all'
): Promise<MonthlyAttendanceData> {
  const { supabase } = await requireActiveUser()

  const fridays = getFridaysOfMonth(year, month)
  const fridayDates = fridays.map((f) => f.date)

  // Fetch all boys with current filters
  const boys = await getBoys('', 'full_name', 'asc', kgLevel)

  // Fetch attendance records for these Friday dates
  const attendanceMap: Record<string, Record<string, AttendanceStatus>> = {} // boyId -> (date -> status)

  try {
    const { data: records, error } = await supabase
      .from('attendance')
      .select('boy_id, date, status')
      .in('date', fridayDates)

    if (!error && records) {
      for (const rec of records) {
        if (!attendanceMap[rec.boy_id]) {
          attendanceMap[rec.boy_id] = {}
        }
        attendanceMap[rec.boy_id][rec.date] = rec.status as AttendanceStatus
      }
    } else if (error && (error.code === 'PGRST205' || error.message.includes('attendance'))) {
      // If table doesn't exist yet, fallback to check_ins metadata
      const daysInMonth = new Date(year, month, 0).getDate()
      const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}T23:59:59.999Z`

      const { data: fallbackRecords } = await supabase
        .from('check_ins')
        .select('boy_id, visit_date, notes, created_at')
        .gte('visit_date', startDate)
        .lte('visit_date', endDate)
        .order('created_at', { ascending: true })

      for (const rec of fallbackRecords || []) {
        if (rec.notes && rec.notes.includes('[ATTENDANCE:')) {
          const match = rec.notes.match(/\[ATTENDANCE:(\d{4}-\d{2}-\d{2}):(\w+)\]/)
          if (match) {
            const [, dateStr, status] = match
            if (fridayDates.includes(dateStr)) {
              if (!attendanceMap[rec.boy_id]) {
                attendanceMap[rec.boy_id] = {}
              }
              attendanceMap[rec.boy_id][dateStr] = status as AttendanceStatus
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Attendance query fallback notice:', err)
  }

  // Build rows per boy
  const rows: BoyAttendanceRow[] = boys.map((boy) => {
    const boyAtt = attendanceMap[boy.id] || {}
    let presentCount = 0

    for (const f of fridays) {
      if (boyAtt[f.date] === 'present') {
        presentCount++
      }
    }

    const totalFridaysCount = fridays.length
    const attendanceRate =
      totalFridaysCount > 0 ? Math.round((presentCount / totalFridaysCount) * 100) : 0

    return {
      boy,
      attendance: boyAtt,
      presentCount,
      totalFridaysCount,
      attendanceRate,
    }
  })

  // Compute monthly KPI statistics
  let totalPresences = 0
  let perfectAttendanceCount = 0
  const totalSlots = rows.length * fridays.length

  const fridayCounts: Record<string, number> = {}
  for (const f of fridays) {
    fridayCounts[f.date] = 0
  }

  for (const r of rows) {
    totalPresences += r.presentCount
    if (fridays.length > 0 && r.presentCount === fridays.length) {
      perfectAttendanceCount++
    }
    for (const f of fridays) {
      if (r.attendance[f.date] === 'present') {
        fridayCounts[f.date]++
      }
    }
  }

  const overallAttendanceRate =
    totalSlots > 0 ? Math.round((totalPresences / totalSlots) * 100) : 0

  let bestFridayDate: string | null = null
  let bestFridayAttendance = 0

  for (const [date, count] of Object.entries(fridayCounts)) {
    if (count > bestFridayAttendance) {
      bestFridayAttendance = count
      bestFridayDate = date
    }
  }

  return {
    year,
    month,
    monthNameAr: ARABIC_MONTHS[month - 1],
    monthNameEn: ENGLISH_MONTHS[month - 1],
    fridays,
    rows,
    stats: {
      totalBoys: boys.length,
      totalFridays: fridays.length,
      overallAttendanceRate,
      perfectAttendanceCount,
      bestFridayDate,
      bestFridayAttendance,
    },
  }
}

/**
 * Toggles or sets attendance for a child on a specific Friday
 */
export async function toggleAttendance(
  boyId: string,
  date: string,
  status: AttendanceStatus,
  notes?: string
): Promise<ActionResult> {
  try {
    const { supabase, user, profile } = await requireActiveUser()

    // 1. Try upserting to public.attendance table
    const { error } = await supabase.from('attendance').upsert(
      {
        boy_id: boyId,
        date,
        status,
        notes: notes || null,
        marked_by: profile ? user.id : null,
      },
      { onConflict: 'boy_id,date' }
    )

    // 2. If table doesn't exist yet, fallback to check_ins
    if (error && (error.code === 'PGRST205' || error.message.includes('attendance'))) {
      const attendanceTag = `[ATTENDANCE:${date}:`

      // Delete any previous attendance record for this boy and date
      const { data: oldRecords } = await supabase
        .from('check_ins')
        .select('id')
        .eq('boy_id', boyId)
        .ilike('notes', `%${attendanceTag}%`)

      if (oldRecords && oldRecords.length > 0) {
        await supabase
          .from('check_ins')
          .delete()
          .in(
            'id',
            oldRecords.map((r) => r.id)
          )
      }

      // If marking present, insert the new record
      if (status === 'present') {
        const attendanceNote = `[ATTENDANCE:${date}:present]${notes ? ' ' + notes : ''}`
        await supabase.from('check_ins').insert({
          boy_id: boyId,
          visit_date: `${date}T10:00:00Z`,
          notes: attendanceNote,
          created_by: profile ? user.id : null,
        })
      }
    } else if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/attendance')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

/**
 * Marks multiple boys (or all) present/absent for a specific Friday
 */
export async function bulkSetFridayAttendance(
  date: string,
  status: AttendanceStatus,
  boyIds: string[]
): Promise<ActionResult> {
  try {
    const { supabase, user, profile } = await requireActiveUser()

    if (!boyIds || boyIds.length === 0) {
      return { success: true }
    }

    const records = boyIds.map((id) => ({
      boy_id: id,
      date,
      status,
      marked_by: profile ? user.id : null,
    }))

    const { error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'boy_id,date' })

    if (error && (error.code === 'PGRST205' || error.message.includes('attendance'))) {
      const attendanceTag = `[ATTENDANCE:${date}:`

      // Delete previous records for these boys on this date
      const { data: oldRecords } = await supabase
        .from('check_ins')
        .select('id')
        .in('boy_id', boyIds)
        .ilike('notes', `%${attendanceTag}%`)

      if (oldRecords && oldRecords.length > 0) {
        await supabase
          .from('check_ins')
          .delete()
          .in(
            'id',
            oldRecords.map((r) => r.id)
          )
      }

      // If marking present, insert for all boys
      if (status === 'present') {
        const inserts = boyIds.map((id) => ({
          boy_id: id,
          visit_date: `${date}T10:00:00Z`,
          notes: `[ATTENDANCE:${date}:present]`,
          created_by: profile ? user.id : null,
        }))
        await supabase.from('check_ins').insert(inserts)
      }
    } else if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/attendance')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
