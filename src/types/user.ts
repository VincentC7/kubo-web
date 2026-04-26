import type { UserRole } from './auth'

export type { UserRole }

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  roles: string[]
  createdAt?: string
}

export interface UpdateProfilePayload {
  firstName?: string
  lastName?: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

/**
 * @deprecated Utiliser UserSettings de @/types/settings à la place
 */
export interface Settings {
  portions: number
  mealsGoal: number
  darkMode: boolean
  viewMode: 'week' | 'month' | 'year'
}
