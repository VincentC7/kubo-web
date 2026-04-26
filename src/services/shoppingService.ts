import httpClient from './httpClient'
import type {
  ShoppingResponse,
  ShoppingList,
  ShoppingItem,
  CreateShoppingItem,
  UpdateShoppingItem,
} from '@/types/shopping'

export const shoppingService = {
  async getList(week?: string): Promise<ShoppingResponse> {
    try {
      const { data } = await httpClient.get('/shopping', {
        params: week ? { week } : {},
      })
      return data
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },

  async generateFromPlanning(week: string): Promise<ShoppingList> {
    try {
      const { data } = await httpClient.post('/shopping/generate', { week })
      return data.data
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },

  async addItem(payload: CreateShoppingItem): Promise<ShoppingItem> {
    try {
      const { data } = await httpClient.post('/shopping/items', payload)
      return data.data
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },

  async updateItem(id: string, payload: UpdateShoppingItem): Promise<ShoppingItem> {
    try {
      const { data } = await httpClient.patch(`/shopping/items/${id}`, payload)
      return data.data
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },

  async removeItem(id: string): Promise<void> {
    try {
      await httpClient.delete(`/shopping/items/${id}`)
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },

  async clearList(week: string): Promise<void> {
    try {
      await httpClient.delete('/shopping', { params: { week } })
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },
}
