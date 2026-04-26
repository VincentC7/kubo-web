import httpClient from './httpClient'
import type {
  PlanningResponse,
  PlanningEntry,
  CreatePlanningEntry,
  UpdatePlanningEntry,
} from '@/types/planning'

export const planningService = {
  async getPlanning(week?: string): Promise<PlanningResponse> {
    try {
      const { data } = await httpClient.get('/planning', {
        params: week ? { week } : {},
      })
      return data
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },

  async addEntry(payload: CreatePlanningEntry): Promise<PlanningEntry> {
    try {
      const { data } = await httpClient.post('/planning', payload)
      return data.data
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },

  async updateEntry(id: string, payload: UpdatePlanningEntry): Promise<PlanningEntry> {
    try {
      const { data } = await httpClient.patch(`/planning/${id}`, payload)
      return data.data
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },

  async removeEntry(id: string): Promise<void> {
    try {
      await httpClient.delete(`/planning/${id}`)
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },
}
