import type { Settings } from '@/types/user'

// Mocké — pas d'endpoint settings disponible pour l'instant
const MOCK_SETTINGS: Settings = {
  portions: 2,
  mealsGoal: 5,
  darkMode: false,
  viewMode: 'week',
}

export const settingsService = {
  async getSettings(): Promise<Settings> {
    return { ...MOCK_SETTINGS }
  },

  async saveSettings(payload: Partial<Settings>): Promise<Settings> {
    Object.assign(MOCK_SETTINGS, payload)
    return { ...MOCK_SETTINGS }
  },
}
