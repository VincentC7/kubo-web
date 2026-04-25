import { ref } from 'vue'
import { defineStore } from 'pinia'
import { settingsService } from '@/services/settingsService'
import { userService } from '@/services/userService'
import { useUiStore } from './uiStore'
import { useAuthStore } from './authStore'
import type { User, Settings, UpdateProfilePayload, ChangePasswordPayload } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const user = ref<User | null>(null)
  const portions = ref(2)
  const mealsGoal = ref(5)
  const viewMode = ref<Settings['viewMode']>('week')

  // ── Actions ────────────────────────────────────────────────────────────────
  function updatePortions(delta: number): void {
    portions.value = Math.max(1, portions.value + delta)
  }

  function updateMealsGoal(delta: number): void {
    mealsGoal.value = Math.max(1, mealsGoal.value + delta)
  }

  function switchViewMode(mode: Settings['viewMode']): void {
    viewMode.value = mode
  }

  async function init(): Promise<void> {
    const authStore = useAuthStore()

    if (authStore.isAuthenticated) {
      const base = userService.getUserFromToken()
      if (base) {
        // firstName/lastName absents du JWT : on les initialise vides,
        // ils seront renseignés dès le premier PATCH ou si l'API les expose.
        user.value = {
          ...base,
          firstName: user.value?.firstName ?? '',
          lastName: user.value?.lastName ?? '',
        }
      }

      const settings = await settingsService.getSettings()
      portions.value = settings.portions
      mealsGoal.value = settings.mealsGoal
      viewMode.value = settings.viewMode

      const uiStore = useUiStore()
      if (settings.darkMode) uiStore.setDarkMode(true)
      else if (window.matchMedia('(prefers-color-scheme: dark)').matches) uiStore.setDarkMode(true)
    } else {
      user.value = null
      const uiStore = useUiStore()
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) uiStore.setDarkMode(true)
    }
  }

  /** Appelée après un PATCH /user réussi — met à jour firstName/lastName localement */
  function setProfile(data: Pick<User, 'firstName' | 'lastName' | 'email'>): void {
    if (!user.value) return
    user.value = { ...user.value, ...data }
  }

  /** Wrapper updateProfile — appelle l'API puis met à jour le store */
  async function updateProfile(payload: UpdateProfilePayload): Promise<void> {
    const updated = await userService.updateProfile(payload)
    setProfile(updated)
  }

  /** Wrapper changePassword — délègue à userService */
  async function changePassword(payload: ChangePasswordPayload): Promise<void> {
    await userService.changePassword(payload)
  }

  return {
    user,
    portions,
    mealsGoal,
    viewMode,
    updatePortions,
    updateMealsGoal,
    switchViewMode,
    init,
    updateProfile,
    changePassword,
  }
})
