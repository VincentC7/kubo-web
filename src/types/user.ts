import type { UserRole } from './auth'

export type { UserRole }

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
}

export interface UpdateProfilePayload {
  firstName?: string
  lastName?: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface Settings {
  portions: number
  mealsGoal: number
  darkMode: boolean
  viewMode: 'week' | 'month' | 'year'
}
