import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSeasonIngredients } from '@/services/seasonService'
import type { SaisonItemDto } from '@/types/recipe'

export const useSeasonStore = defineStore('season', () => {
  const fruits = ref<SaisonItemDto[]>([])
  const legumes = ref<SaisonItemDto[]>([])
  const loading = ref(false)
  const currentMonth = ref(new Date().getMonth() + 1)

  async function init(mois?: number) {
    loading.value = true
    try {
      const month = mois ?? new Date().getMonth() + 1
      currentMonth.value = month
      const data = await getSeasonIngredients(month)
      fruits.value = data.fruits
      legumes.value = data.legumes
    } finally {
      loading.value = false
    }
  }

  function setMonth(mois: number): void {
    currentMonth.value = mois
  }

  return { fruits, legumes, loading, currentMonth, init, setMonth }
})
