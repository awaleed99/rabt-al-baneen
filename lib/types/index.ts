// ─── Database Types (auto-matches the SQL schema) ─────────────────────────

export type UserRole = 'admin' | 'user'
export type KgLevel = 'kg1' | 'kg2'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Boy {
  id: string
  full_name: string
  profile_image_url: string | null
  kg_level: KgLevel
  address: string | null
  date_of_birth: string | null
  phone_number: string | null
  father_phone?: string | null
  mother_phone?: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Computed / joined
  last_check_in?: string | null
  check_in_count?: number
  creator?: Pick<Profile, 'id' | 'full_name' | 'email'>
  assigned_servant_id?: string | null
  assigned_servant?: Pick<Profile, 'id' | 'full_name' | 'email'>
}

export type VisitationType = 'call' | 'home' | 'church' | 'health' | 'general'

export interface CheckIn {
  id: string
  boy_id: string
  created_by: string | null
  visit_date: string
  visitation_type?: VisitationType
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  creator?: Pick<Profile, 'id' | 'full_name' | 'email'>
  boy?: Pick<Boy, 'id' | 'full_name' | 'profile_image_url'>
}

// ─── Attendance Types (Weekly Friday Attendance) ────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'excused'

export interface AttendanceRecord {
  id: string
  boy_id: string
  date: string // YYYY-MM-DD (Friday)
  status: AttendanceStatus
  notes?: string | null
  marked_by?: string | null
  created_at: string
  updated_at: string
}

export interface FridayInfo {
  date: string // YYYY-MM-DD
  dayNumber: number
  labelAr: string
  labelEn: string
  isToday: boolean
  isPast: boolean
}

export interface BoyAttendanceRow {
  boy: Boy
  attendance: Record<string, AttendanceStatus> // date -> status
  presentCount: number
  totalFridaysCount: number
  attendanceRate: number // 0 - 100
}

export interface MonthlyAttendanceData {
  year: number
  month: number
  monthNameAr: string
  monthNameEn: string
  fridays: FridayInfo[]
  rows: BoyAttendanceRow[]
  stats: {
    totalBoys: number
    totalFridays: number
    overallAttendanceRate: number
    perfectAttendanceCount: number
    bestFridayDate: string | null
    bestFridayAttendance: number
  }
}

// ─── Form / Mutation Types ──────────────────────────────────────────────────

export interface BoyFormData {
  full_name: string
  kg_level: KgLevel
  address: string
  date_of_birth: string
  phone_number: string
  father_phone?: string
  mother_phone?: string
  assigned_servant_id?: string | null
  notes: string
}

export interface CheckInFormData {
  visit_date: string
  notes: string
}

export interface UserFormData {
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
  password?: string
}

// ─── API Response Types ─────────────────────────────────────────────────────

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

// ─── Dashboard Stats ────────────────────────────────────────────────────────

export interface DashboardStats {
  totalBoys: number
  kg1Count: number
  kg2Count: number
  totalCheckIns: number
  recentCheckIns: number        // last 7 days
  overdueCount: number          // no check-in in OVERDUE_DAYS
  activeUsers: number
  recentCheckInsList: (CheckIn & { boy: Pick<Boy, 'id' | 'full_name' | 'profile_image_url'> })[]
  todayBirthdays?: Boy[]
  weekBirthdays?: Boy[]
}

// ─── Filter/Sort Types ──────────────────────────────────────────────────────

export type SortField = 'full_name' | 'last_check_in' | 'created_at'
export type SortOrder = 'asc' | 'desc'

export interface BoysFilter {
  search: string
  kgLevel: 'all' | 'kg1' | 'kg2'
  sortField: SortField
  sortOrder: SortOrder
  overdueOnly: boolean
}

// ─── Pastoral Care & Visitation Types ───────────────────────────────────────

export interface PastoralAlert {
  boy: Boy
  reason: 'consecutive_absences' | 'no_visit_long' | 'never_visited'
  descriptionAr: string
  descriptionEn: string
  consecutiveAbsencesCount?: number
  daysSinceLastVisit?: number
}

export interface CareDashboardData {
  allBoys: Boy[]
  assignedBoys: Boy[]
  urgentAlerts: PastoralAlert[]
  servants: Profile[]
  recentVisitations: (CheckIn & { boy?: Pick<Boy, 'id' | 'full_name' | 'profile_image_url' | 'kg_level'> })[]
  stats: {
    totalBoys: number
    assignedCount: number
    unassignedCount: number
    urgentCount: number
    visitsThisMonth: number
  }
}

// ─── Monthly Birthdays Explorer Types ────────────────────────────────────────

export interface BirthdayBoyInfo extends Boy {
  turningAge: number
  birthDay: number
  birthMonth: number
  dayNameAr: string
  dayNameEn: string
  isToday: boolean
}

export interface MonthlyBirthdaysData {
  year: number
  month: number
  monthNameAr: string
  monthNameEn: string
  boys: BirthdayBoyInfo[]
  stats: {
    totalThisMonth: number
    kg1Count: number
    kg2Count: number
    todayCount: number
  }
}

// ─── Priest & Ministry Executive Report Types ───────────────────────────────

export interface PriestMonthlyReportData {
  year: number
  month: number
  monthNameAr: string
  monthNameEn: string
  totalBoysCount: number
  overallAttendanceRate: number
  perfectAttendanceBoys: Boy[]
  urgentCareBoys: PastoralAlert[]
  visitationsSummary: {
    totalVisits: number
    callCount: number
    homeCount: number
    churchCount: number
    healthCount: number
    generalCount: number
  }
  recentVisits: (CheckIn & { boy?: Pick<Boy, 'id' | 'full_name'> })[]
  birthdaysThisMonth: BirthdayBoyInfo[]
  generatedAt: string
}

