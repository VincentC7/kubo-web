import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { inventoryService } from '@/services/inventoryService'
import { usePlanningStore } from './planningStore'
import type { Ingredient } from '@/types/recipe'

export const useInventoryStore = defineStore('inventory', () => {
  // ---- State ----
  const inventory = ref<Ingredient[]>([])

  // ---- Computed ----
  const groceryProgress = computed(() => {
    const planningStore = usePlanningStore()
    const allIngredients = planningStore.selectedRecipes.flatMap((r) => r.ingredients)
    const total = allIngredients.length
    const checked = allIngredients.filter((i) =>
      inventory.value.some((inv) => inv.name === i.name),
    ).length
    return { checked, total }
  })

  const progressPercent = computed(() => {
    const { checked, total } = groceryProgress.value
    if (!total) return 0
    return Math.round((checked / total) * 100)
  })

  const progressText = computed(() => {
    const { checked, total } = groceryProgress.value
    return `${checked}/${total}`
  })

  // ---- Actions ----
  function isInInventory(name: string): boolean {
    return inventory.value.some((i) => i.name === name)
  }

  function updateInventory(ingredient: Ingredient, isAdding: boolean): void {
    if (isAdding) {
      if (!isInInventory(ingredient.name)) {
        inventory.value = [...inventory.value, { ...ingredient }]
      }
    } else {
      inventory.value = inventory.value.filter((i) => i.name !== ingredient.name)
    }
  }

  function toggleRecipeIngredients(recipeId: string): void {
    const planningStore = usePlanningStore()
    const recipe = planningStore.selectedRecipes.find((r) => r.id === recipeId)
    if (!recipe) return
    const allInStock = recipe.ingredients.every((ing) => isInInventory(ing.name))
    if (allInStock) {
      recipe.ingredients.forEach((ing) => {
        inventory.value = inventory.value.filter((inv) => inv.name !== ing.name)
      })
    } else {
      recipe.ingredients.forEach((ing) => {
        if (!isInInventory(ing.name)) {
          inventory.value = [...inventory.value, { ...ing }]
        }
      })
    }
  }

  async function init(): Promise<void> {
    inventory.value = await inventoryService.getInventory()
  }

  return {
    inventory,
    progressPercent,
    progressText,
    isInInventory,
    updateInventory,
    toggleRecipeIngredients,
    init,
  }
})
