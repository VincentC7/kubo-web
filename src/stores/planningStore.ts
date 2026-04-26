import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { planningService } from '@/services/planningService'
import { useRecipeStore } from './recipeStore'
import { useUiStore } from './uiStore'
import type { PlanningEntry, PlanningMeta } from '@/types/planning'

// ---- Helpers semaine ----
const MS_PER_DAY = 86400000

function getWeekKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7)
  return `${d.getFullYear()}-W${weekNo}`
}

function getWeekRange(date: Date): string {
  const d = new Date(date)
  const day = d.getDay() || 7
  const mon = new Date(d)
  mon.setDate(d.getDate() - day + 1)
  const sun = new Date(d)
  sun.setDate(d.getDate() - day + 7)
  const fmt = (dt: Date) => dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return `${fmt(mon)} — ${fmt(sun)}`
}

export const usePlanningStore = defineStore('planning', () => {
  // ---- State ----
  const entries = ref<PlanningEntry[]>([])
  const meta = ref<PlanningMeta | null>(null)
  const currentDate = ref(new Date())
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ---- Computed ----
  const weekKey = computed(() => getWeekKey(currentDate.value))
  const weekRange = computed(() => getWeekRange(currentDate.value))
  const periodLabel = computed(() => getWeekRange(currentDate.value))

  // Alias : selectedRecipes = toutes les entries de la semaine enrichies avec les données recipeStore
  const selectedRecipes = computed(() => {
    const recipeStore = useRecipeStore()
    return recipeStore.recipesWithPrice.filter((r) =>
      entries.value.some((e) => e.recette.id === r.id),
    )
  })

  const doneRecipes = computed(() =>
    selectedRecipes.value.filter((r) => entries.value.find((e) => e.recette.id === r.id)?.done),
  )

  const nutritionTotals = computed(() => {
    if (!selectedRecipes.value.length) return null
    return selectedRecipes.value.reduce(
      (acc, r) => ({ prot: acc.prot + r.prot, fat: acc.fat + r.fat, carb: acc.carb + r.carb }),
      { prot: 0, fat: 0, carb: 0 },
    )
  })

  const totalPrice = computed(() => selectedRecipes.value.reduce((acc, r) => acc + r.totalPrice, 0))

  const avgPrice = computed(() => {
    if (!selectedRecipes.value.length) return 0
    return totalPrice.value / selectedRecipes.value.length
  })

  // ---- Helpers non réactifs ----
  function isSelected(recetteId: string): boolean {
    return entries.value.some((e) => e.recette.id === recetteId)
  }

  function isDone(recetteIdOrEntryId: string): boolean {
    return entries.value.some(
      (e) => (e.recette.id === recetteIdOrEntryId || e.id === recetteIdOrEntryId) && e.done,
    )
  }

  // ---- Actions ----
  async function init(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await planningService.getPlanning(weekKey.value)
      entries.value = response.data
      meta.value = response.meta

      // Hydrater les données nutritionnelles pour chaque recette du planning
      // (la liste catalogue ne contient que prot/fat/carb = 0)
      if (entries.value.length > 0) {
        const { useRecipeStore } = await import('./recipeStore')
        const recipeStore = useRecipeStore()
        await Promise.all(entries.value.map((e) => recipeStore.fetchDetail(e.recette.id)))
      }
    } catch (e: any) {
      error.value = e?.error ?? 'Erreur lors du chargement du planning'
    } finally {
      loading.value = false
    }
  }

  async function changePeriod(delta: number): Promise<void> {
    const d = new Date(currentDate.value)
    d.setDate(d.getDate() + delta * 7)
    currentDate.value = d
    await init()
  }

  async function toggleRecipe(recetteId: string): Promise<void> {
    const existing = entries.value.find((e) => e.recette.id === recetteId)
    const uiStore = useUiStore()
    try {
      if (existing) {
        await planningService.removeEntry(existing.id)
        entries.value = entries.value.filter((e) => e.id !== existing.id)
      } else {
        const { useUserStore } = await import('./userStore')
        const userStore = useUserStore()
        const entry = await planningService.addEntry({
          recetteId,
          week: weekKey.value,
          portions: userStore.portions,
        })
        entries.value.push(entry)
        // Hydrater les données nutritionnelles de la recette ajoutée
        const { useRecipeStore } = await import('./recipeStore')
        useRecipeStore().fetchDetail(recetteId)
      }
      const { useShoppingStore } = await import('./shoppingStore')
      useShoppingStore().generate()
    } catch (e: any) {
      uiStore.notify(e?.error ?? 'Erreur lors de la mise à jour du planning')
    }
  }

  async function markAsDone(id: string): Promise<void> {
    const uiStore = useUiStore()
    // id peut être un recetteId ou un entryId
    const entry = entries.value.find((e) => e.recette.id === id || e.id === id)
    if (!entry) return
    try {
      const updated = await planningService.updateEntry(entry.id, { done: !entry.done })
      Object.assign(entry, updated)
      if (updated.done) uiStore.notify('Recette marquée comme cuisinée !')
    } catch (e: any) {
      uiStore.notify(e?.error ?? 'Erreur lors de la mise à jour')
    }
  }

  async function clearPlanning(): Promise<void> {
    const uiStore = useUiStore()
    try {
      await Promise.all(entries.value.map((e) => planningService.removeEntry(e.id)))
      entries.value = []
      uiStore.notify('Semaine réinitialisée')
      const { useShoppingStore } = await import('./shoppingStore')
      useShoppingStore().generate()
    } catch (e: any) {
      uiStore.notify(e?.error ?? 'Erreur lors de la réinitialisation')
    }
  }

  return {
    entries,
    meta,
    currentDate,
    loading,
    error,
    weekKey,
    weekRange,
    periodLabel,
    selectedRecipes,
    doneRecipes,
    nutritionTotals,
    totalPrice,
    avgPrice,
    isSelected,
    isDone,
    init,
    changePeriod,
    toggleRecipe,
    markAsDone,
    clearPlanning,
  }
})
