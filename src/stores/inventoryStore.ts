import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { inventoryService } from '@/services/inventoryService'
import { usePlanningStore } from './planningStore'
import type { Ingredient } from '@/types/recipe'

export const useInventoryStore = defineStore('inventory', () => {
  // ---- State ----
  const inventory = ref<Ingredient[]>([])
  const showInventory = ref(true)
  const showGroceries = ref(true)

  // ---- Computed ----
  const progressPercent = computed(() => {
    const planningStore = usePlanningStore()
    const totalIngs = planningStore.selectedRecipes.flatMap((r) => r.ingredients).length
    if (!totalIngs) return 0
    const checked = planningStore.selectedRecipes
      .flatMap((r) => r.ingredients)
      .filter((i) => inventory.value.find((inv) => inv.name === i.name)).length
    return Math.round((checked / totalIngs) * 100)
  })

  const progressText = computed(() => {
    const planningStore = usePlanningStore()
    const totalIngs = planningStore.selectedRecipes.flatMap((r) => r.ingredients).length
    const checked = planningStore.selectedRecipes
      .flatMap((r) => r.ingredients)
      .filter((i) => inventory.value.find((inv) => inv.name === i.name)).length
    return `${checked}/${totalIngs}`
  })

  // ---- Actions ----
  function isInInventory(name: string): boolean {
    return !!inventory.value.find((i) => i.name === name)
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

  function consumeRecipeIngredients(recipeId: string): void {
    const planningStore = usePlanningStore()
    const recipe = planningStore.selectedRecipes.find((r) => r.id === recipeId)
    if (!recipe) return
    recipe.ingredients.forEach((ing) => {
      inventory.value = inventory.value.filter((item) => item.name !== ing.name)
    })
  }

  async function init(): Promise<void> {
    inventory.value = await inventoryService.getInventory()
  }

  return {
    inventory,
    showInventory,
    showGroceries,
    progressPercent,
    progressText,
    isInInventory,
    updateInventory,
    toggleRecipeIngredients,
    consumeRecipeIngredients,
    init,
  }
})
