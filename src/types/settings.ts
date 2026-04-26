export type ViewMode = 'week' | 'list'
export type DietaryPref =
  | 'vegetarien'
  | 'vegan'
  | 'sans-gluten'
  | 'sans-lactose'
  | 'halal'
  | 'casher'

export interface NotificationSettings {
  planningReminder: boolean
  expiryAlert: boolean
}

export interface UserSettings {
  portionsDefault: number
  mealsGoal: number
  viewMode: ViewMode
  dietaryPrefs: DietaryPref[]
  notifications: NotificationSettings
}
