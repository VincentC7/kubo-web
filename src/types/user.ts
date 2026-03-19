export interface User {
  id: number
  name: string
  initials: string
  role: string
  goalKcal: number
  avatar: string
}

export interface Settings {
  portions: number
  mealsGoal: number
  darkMode: boolean
  viewMode: 'week' | 'month' | 'year'
}
