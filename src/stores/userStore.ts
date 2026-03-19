import { ref } from 'vue'
import { defineStore } from 'pinia'
import { userService } from '@/services/userService'
import { settingsService } from '@/services/settingsService'
import { useUiStore } from './uiStore'
import type { User, Settings } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  // ---- State ----
  const user = ref<User | null>(null)
  const portions = ref(2)
  const mealsGoal = ref(5)
  const viewMode = ref<Settings['viewMode']>('week')

  // ---- Actions ----
  function updatePortions(delta: number): void {
    portions.value = Math.max(1, portions.value + delta)
  }

  function updateMealsGoal(delta: number): void {
    mealsGoal.value = Math.max(1, mealsGoal.value + delta)
  }

  function switchViewMode(mode: Settings['viewMode']): void {
    viewMode.value = mode
  }

  async function saveUser(payload: Partial<User>): Promise<void> {
    const updated = await userService.saveUser(payload)
    user.value = updated
  }

  async function init(): Promise<void> {
    const [userData, settings] = await Promise.all([
      userService.getUser(),
      settingsService.getSettings(),
    ])
    user.value = userData
    portions.value = settings.portions
    mealsGoal.value = settings.mealsGoal
    viewMode.value = settings.viewMode

    const uiStore = useUiStore()
    if (settings.darkMode) uiStore.setDarkMode(true)
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) uiStore.setDarkMode(true)
  }

  return {
    user,
    portions,
    mealsGoal,
    viewMode,
    updatePortions,
    updateMealsGoal,
    switchViewMode,
    saveUser,
    init,
  }
})
