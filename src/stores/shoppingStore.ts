import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { shoppingService } from '@/services/shoppingService'
import { usePlanningStore } from './planningStore'
import { useUiStore } from './uiStore'
import type { ShoppingList, ShoppingItem, CreateShoppingItem } from '@/types/shopping'

export const useShoppingStore = defineStore('shopping', () => {
  const list = ref<ShoppingList | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Grouper les items par catégorie
  const itemsByCategory = computed(() => {
    if (!list.value) return {} as Record<string, ShoppingItem[]>
    return list.value.items.reduce(
      (acc, item) => {
        const cat = item.category ?? 'Autre'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(item)
        return acc
      },
      {} as Record<string, ShoppingItem[]>,
    )
  })

  const checkedCount = computed(() => list.value?.items.filter((i) => i.checked).length ?? 0)
  const totalCount = computed(() => list.value?.items.length ?? 0)

  async function fetchList(week?: string): Promise<void> {
    const planningStore = usePlanningStore()
    loading.value = true
    error.value = null
    try {
      const response = await shoppingService.getList(week ?? planningStore.weekKey)
      list.value = response.data
    } catch (e: any) {
      error.value = e?.error ?? 'Erreur lors du chargement de la liste'
    } finally {
      loading.value = false
    }
  }

  async function generate(): Promise<void> {
    const planningStore = usePlanningStore()
    const uiStore = useUiStore()
    loading.value = true
    error.value = null
    try {
      list.value = await shoppingService.generateFromPlanning(planningStore.weekKey)
      uiStore.notify('Liste générée depuis le planning')
    } catch (e: any) {
      error.value = e?.error ?? 'Erreur lors de la génération'
    } finally {
      loading.value = false
    }
  }

  async function addItem(payload: CreateShoppingItem): Promise<void> {
    const uiStore = useUiStore()
    try {
      const item = await shoppingService.addItem(payload)
      list.value?.items.push(item)
    } catch (e: any) {
      uiStore.notify(e?.error ?? "Erreur lors de l'ajout")
    }
  }

  async function toggleItem(id: string): Promise<void> {
    const item = list.value?.items.find((i) => i.id === id)
    if (!item) return
    const nowChecked = !item.checked
    try {
      const updated = await shoppingService.updateItem(id, { checked: nowChecked })
      if (list.value) {
        const idx = list.value.items.findIndex((i) => i.id === id)
        if (idx !== -1) list.value.items[idx] = { ...list.value.items[idx], ...updated }
      }

      // Sync inventaire : coché → ajout, décoché → retrait
      const { useInventoryStore } = await import('./inventoryStore')
      const inventoryStore = useInventoryStore()

      if (nowChecked) {
        // Chercher si l'ingrédient existe déjà dans l'inventaire (par nom, insensible à la casse)
        const existing = inventoryStore.items.find(
          (i) => i.name.toLowerCase() === item.ingredientName.toLowerCase(),
        )
        if (existing) {
          // Incrémenter la quantité existante
          const addQty = item.quantity ?? 1
          await inventoryStore.updateItem(existing.id, {
            quantity: (existing.quantity ?? 0) + addQty,
          })
        } else {
          // Créer une nouvelle entrée
          await inventoryStore.addItem({
            name: item.ingredientName,
            quantity: item.quantity ?? 1,
            unit: item.unit ?? undefined,
            category: item.category ?? undefined,
          })
        }
      } else {
        // Décoché → retirer de l'inventaire (cherche par nom)
        const existing = inventoryStore.items.find(
          (i) => i.name.toLowerCase() === item.ingredientName.toLowerCase(),
        )
        if (existing) {
          await inventoryStore.removeItem(existing.id)
        }
      }
    } catch (e: any) {
      const uiStore = useUiStore()
      uiStore.notify(e?.error ?? 'Erreur lors de la mise à jour')
    }
  }

  async function removeItem(id: string): Promise<void> {
    try {
      await shoppingService.removeItem(id)
      if (list.value) {
        list.value.items = list.value.items.filter((i) => i.id !== id)
      }
    } catch (e: any) {
      const uiStore = useUiStore()
      uiStore.notify(e?.error ?? 'Erreur lors de la suppression')
    }
  }

  async function checkAll(): Promise<void> {
    if (!list.value) return
    const unchecked = list.value.items.filter((i) => !i.checked)
    if (unchecked.length === 0) return
    await Promise.all(unchecked.map((i) => toggleItem(i.id)))
  }

  async function clearList(): Promise<void> {
    const planningStore = usePlanningStore()
    const uiStore = useUiStore()
    try {
      await shoppingService.clearList(planningStore.weekKey)
      if (list.value) list.value.items = []
      uiStore.notify('Liste vidée')
    } catch (e: any) {
      uiStore.notify(e?.error ?? 'Erreur lors de la suppression')
    }
  }

  async function init(): Promise<void> {
    await fetchList()
  }

  return {
    list,
    loading,
    error,
    itemsByCategory,
    checkedCount,
    totalCount,
    fetchList,
    generate,
    addItem,
    toggleItem,
    removeItem,
    clearList,
    checkAll,
    init,
  }
})
