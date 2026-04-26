import httpClient from './httpClient'
import type { UserSettings } from '@/types/settings'

export const settingsService = {
  async getSettings(): Promise<UserSettings> {
    try {
      const { data } = await httpClient.get('/settings')
      return data.data
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },

  async updateSettings(payload: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const { data } = await httpClient.patch('/settings', payload)
      return data.data
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },
}
