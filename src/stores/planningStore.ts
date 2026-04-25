import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import { planningService } from '@/services/planningService'
import { useRecipeStore } from './recipeStore'
import { useUiStore } from './uiStore'
import type { WeekEntry, WeeklyData } from '@/types/planning'

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
  const weeklyData = reactive<WeeklyData>({})
  const currentDate = ref(new Date())

  // ---- Computed ----
  const weekKey = computed(() => getWeekKey(currentDate.value))
  const weekRange = computed(() => getWeekRange(currentDate.value))

  const periodLabel = computed(() => getWeekRange(currentDate.value))

  const selectedRecipes = computed(() => {
    const recipeStore = useRecipeStore()
    const entries = getWeekEntries()
    return recipeStore.recipesWithPrice.filter((r) => entries[r.id]?.selected)
  })

  const doneRecipes = computed(() =>
    selectedRecipes.value.filter((r) => getWeekEntries()[r.id]?.done),
  )

  const nutritionTotals = computed(() => {
    if (!selectedRecipes.value.length) return { prot: 30, fat: 30, carb: 40 }
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

  // ---- Helpers internes ----
  function ensureWeek(key: string): void {
    if (!weeklyData[key]) weeklyData[key] = {}
  }

  function getWeekEntries(): Record<string, WeekEntry> {
    const key = weekKey.value
    ensureWeek(key)
    return weeklyData[key]
  }

  // ---- Navigation temporelle ----
  function changePeriod(delta: number): void {
    const d = new Date(currentDate.value)
    d.setDate(d.getDate() + delta * 7)
    currentDate.value = d
  }

  // ---- Actions planning ----
  function toggleRecipe(id: string): void {
    const entries = getWeekEntries()
    if (!entries[id]) entries[id] = { selected: false, done: false }
    entries[id].selected = !entries[id].selected
    if (!entries[id].selected) entries[id].done = false
  }

  function markAsDone(id: string): void {
    const uiStore = useUiStore()
    const entries = getWeekEntries()
    if (entries[id]) {
      entries[id].done = !entries[id].done
      if (entries[id].done) {
        uiStore.notify('Recette marquée comme cuisinée !')
      }
    }
  }

  function isSelected(id: string): boolean {
    return !!getWeekEntries()[id]?.selected
  }

  function isDone(id: string): boolean {
    return !!getWeekEntries()[id]?.done
  }

  function clearPlanning(): void {
    const uiStore = useUiStore()
    weeklyData[weekKey.value] = {}
    uiStore.notify('Semaine réinitialisée')
  }

  async function init(): Promise<void> {
    const data = await planningService.getPlanning()
    Object.assign(weeklyData, data)
  }

  return {
    weeklyData,
    currentDate,
    weekKey,
    weekRange,
    periodLabel,
    selectedRecipes,
    doneRecipes,
    nutritionTotals,
    totalPrice,
    avgPrice,
    changePeriod,
    toggleRecipe,
    markAsDone,
    isSelected,
    isDone,
    clearPlanning,
    init,
  }
})
