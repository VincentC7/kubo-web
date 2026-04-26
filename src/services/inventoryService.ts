import httpClient from './httpClient'
import type {
  InventoryResponse,
  InventoryItem,
  CreateInventoryItem,
  UpdateInventoryItem,
  InventoryFilters,
} from '@/types/inventory'

export const inventoryService = {
  async getInventory(filters?: InventoryFilters): Promise<InventoryResponse> {
    try {
      const { data } = await httpClient.get('/inventory', { params: filters })
      return data
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },

  async addItem(payload: CreateInventoryItem): Promise<InventoryItem> {
    try {
      const { data } = await httpClient.post('/inventory', payload)
      return data.data
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },

  async updateItem(id: string, payload: UpdateInventoryItem): Promise<InventoryItem> {
    try {
      const { data } = await httpClient.patch(`/inventory/${id}`, payload)
      return data.data
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },

  async removeItem(id: string): Promise<void> {
    try {
      await httpClient.delete(`/inventory/${id}`)
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },
}
