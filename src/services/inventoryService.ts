import type { Ingredient } from '@/types/recipe'

// Mocké — pas d'endpoint inventaire disponible pour l'instant
let MOCK_INVENTORY: Ingredient[] = []

export const inventoryService = {
  async getInventory(): Promise<Ingredient[]> {
    return structuredClone(MOCK_INVENTORY)
  },

  async saveInventory(items: Ingredient[]): Promise<void> {
    MOCK_INVENTORY = structuredClone(items)
  },
}
