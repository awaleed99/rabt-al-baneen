// ─── Database Types (auto-matches the SQL schema) ─────────────────────────

export type UserRole = 'admin' | 'user'

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
  address: string | null
  date_of_birth: string | null
  phone_number: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Computed / joined
  last_check_in?: string | null
  check_in_count?: number
  creator?: Pick<Profile, 'id' | 'full_name' | 'email'>
}

export interface CheckIn {
  id: string
  boy_id: string
  created_by: string | null
  visit_date: string
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  creator?: Pick<Profile, 'id' | 'full_name' | 'email'>
  boy?: Pick<Boy, 'id' | 'full_name' | 'profile_image_url'>
}

// ─── Form / Mutation Types ──────────────────────────────────────────────────

export interface BoyFormData {
  full_name: string
  address: string
  date_of_birth: string
  phone_number: string
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
  totalCheckIns: number
  recentCheckIns: number        // last 7 days
  overdueCount: number          // no check-in in OVERDUE_DAYS
  activeUsers: number
  recentCheckInsList: (CheckIn & { boy: Pick<Boy, 'id' | 'full_name' | 'profile_image_url'> })[]
}

// ─── Filter/Sort Types ──────────────────────────────────────────────────────

export type SortField = 'full_name' | 'last_check_in' | 'created_at'
export type SortOrder = 'asc' | 'desc'

export interface BoysFilter {
  search: string
  sortField: SortField
  sortOrder: SortOrder
  overdueOnly: boolean
}
