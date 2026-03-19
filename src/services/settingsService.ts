import type { Settings } from '@/types/user'

// Mocké — à remplacer par l'API
let mockSettings: Settings = {
  portions: 2,
  mealsGoal: 5,
  darkMode: false,
  viewMode: 'week',
}

export const settingsService = {
  async getSettings(): Promise<Settings> {
    return { ...mockSettings }
  },

  async saveSettings(payload: Partial<Settings>): Promise<Settings> {
    Object.assign(mockSettings, payload)
    return { ...mockSettings }
  },
}
