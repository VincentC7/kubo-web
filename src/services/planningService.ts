import type { WeeklyData } from '@/types/planning'

// Mocké — pas d'endpoint planning disponible pour l'instant
let MOCK_PLANNING: WeeklyData = {}

export const planningService = {
  async getPlanning(): Promise<WeeklyData> {
    return structuredClone(MOCK_PLANNING)
  },

  async savePlanning(data: WeeklyData): Promise<void> {
    MOCK_PLANNING = structuredClone(data)
  },
}
