import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { settingsService } from '@/services/settingsService'
import { userService } from '@/services/userService'
import { useUiStore } from './uiStore'
import { useAuthStore } from './authStore'
import type { User, UpdateProfilePayload, ChangePasswordPayload } from '@/types/user'
import type { UserSettings } from '@/types/settings'

export const useUserStore = defineStore('user', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const user = ref<User | null>(null)
  const settings = ref<UserSettings | null>(null)

  // ── Getters ────────────────────────────────────────────────────────────────
  const portions = computed(() => settings.value?.portionsDefault ?? 2)
  const mealsGoal = computed(() => settings.value?.mealsGoal ?? 5)
  const viewMode = computed(() => settings.value?.viewMode ?? 'week')

  // ── Actions ────────────────────────────────────────────────────────────────
  async function init(): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      user.value = null
      const uiStore = useUiStore()
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) uiStore.setDarkMode(true)
      return
    }

    // 1. Récupérer le profil complet depuis l'API
    try {
      user.value = await userService.getUser()
    } catch {
      // Fallback : décoder depuis le JWT si GET /user échoue
      const base = userService.getUserFromToken()
      if (base) {
        user.value = {
          ...base,
          firstName: user.value?.firstName ?? '',
          lastName: user.value?.lastName ?? '',
        }
      }
    }

    // 2. Charger les settings
    try {
      settings.value = await settingsService.getSettings()
    } catch {
      // Garder les valeurs par défaut si l'API échoue
    }

    const uiStore = useUiStore()
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) uiStore.setDarkMode(true)
  }

  function setProfile(data: Pick<User, 'firstName' | 'lastName' | 'email'>): void {
    if (!user.value) return
    user.value = { ...user.value, ...data }
  }

  async function updateProfile(payload: UpdateProfilePayload): Promise<void> {
    const updated = await userService.updateProfile(payload)
    setProfile(updated)
  }

  async function changePassword(payload: ChangePasswordPayload): Promise<void> {
    await userService.changePassword(payload)
  }

  async function updatePortions(delta: number): Promise<void> {
    const newVal = Math.max(1, portions.value + delta)
    try {
      settings.value = await settingsService.updateSettings({ portionsDefault: newVal })
    } catch {
      // Optimistic update si l'API échoue
      if (settings.value) settings.value = { ...settings.value, portionsDefault: newVal }
    }
  }

  async function updateMealsGoal(delta: number): Promise<void> {
    const newVal = Math.max(1, mealsGoal.value + delta)
    try {
      settings.value = await settingsService.updateSettings({ mealsGoal: newVal })
    } catch {
      if (settings.value) settings.value = { ...settings.value, mealsGoal: newVal }
    }
  }

  async function switchViewMode(mode: UserSettings['viewMode']): Promise<void> {
    try {
      settings.value = await settingsService.updateSettings({ viewMode: mode })
    } catch {
      if (settings.value) settings.value = { ...settings.value, viewMode: mode }
    }
  }

  return {
    user,
    settings,
    portions,
    mealsGoal,
    viewMode,
    init,
    updateProfile,
    changePassword,
    updatePortions,
    updateMealsGoal,
    switchViewMode,
  }
})
