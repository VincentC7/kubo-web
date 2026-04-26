import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { inventoryService } from '@/services/inventoryService'
import { useUiStore } from './uiStore'
import type {
  InventoryItem,
  CreateInventoryItem,
  UpdateInventoryItem,
  InventoryFilters,
} from '@/types/inventory'

export const useInventoryStore = defineStore('inventory', () => {
  // ---- State ----
  const items = ref<InventoryItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ---- Computed ----
  const expiringSoon = computed(() => items.value.filter((i) => i.status === 'expiring_soon'))
  const expired = computed(() => items.value.filter((i) => i.status === 'expired'))

  const itemsByCategory = computed(() => {
    return items.value.reduce(
      (acc, item) => {
        const cat = item.category ?? 'Autre'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(item)
        return acc
      },
      {} as Record<string, InventoryItem[]>,
    )
  })

  // ---- Actions ----
  async function fetchInventory(filters?: InventoryFilters): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await inventoryService.getInventory(filters)
      items.value = response.data
    } catch (e: any) {
      error.value = e?.error ?? "Erreur lors du chargement de l'inventaire"
    } finally {
      loading.value = false
    }
  }

  async function addItem(payload: CreateInventoryItem): Promise<void> {
    const uiStore = useUiStore()
    try {
      const item = await inventoryService.addItem(payload)
      items.value.push(item)
    } catch (e: any) {
      uiStore.notify(e?.error ?? "Erreur lors de l'ajout")
    }
  }

  async function updateItem(id: string, payload: UpdateInventoryItem): Promise<void> {
    const uiStore = useUiStore()
    try {
      const updated = await inventoryService.updateItem(id, payload)
      const index = items.value.findIndex((i) => i.id === id)
      if (index !== -1) items.value[index] = updated
    } catch (e: any) {
      uiStore.notify(e?.error ?? 'Erreur lors de la mise à jour')
    }
  }

  async function removeItem(id: string): Promise<void> {
    const uiStore = useUiStore()
    try {
      await inventoryService.removeItem(id)
      items.value = items.value.filter((i) => i.id !== id)
    } catch (e: any) {
      uiStore.notify(e?.error ?? 'Erreur lors de la suppression')
    }
  }

  async function init(): Promise<void> {
    await fetchInventory()
  }

  return {
    items,
    loading,
    error,
    expiringSoon,
    expired,
    itemsByCategory,
    fetchInventory,
    addItem,
    updateItem,
    removeItem,
    init,
  }
})
