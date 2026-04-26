import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authService } from '@/services/authService'
import { tokenService } from '@/services/tokenService'
import type { LoginPayload, RegisterPayload, UserRole } from '@/types/auth'
import type { User } from '@/types/user'

export const useAuthStore = defineStore('auth', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  // Le token est stocké en mémoire (localStorage géré par tokenService)
  const user = ref<Pick<User, 'email' | 'role'> | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const currentRole = computed((): UserRole => {
    // Priorité : rôle lu depuis le profil API (user.roles)
    // Fallback : rôle décodé depuis le JWT (user.value?.role)
    if (user.value?.role) return user.value.role
    return 'visitor'
  })

  // ── Helpers ────────────────────────────────────────────────────────────────
  function decodeUser(token: string): void {
    const payload = tokenService.decodePayload(token)
    if (!payload) return

    // Symfony retourne ROLE_USER, ROLE_ADMIN — on mappe vers notre UserRole
    const roles = payload.roles ?? []
    let role: UserRole = 'user'
    if (roles.includes('ROLE_ADMIN')) role = 'admin'

    // Symfony peut exposer l'identifiant sous `username` ou `email` selon la config
    const email = payload.username ?? payload.email ?? ''
    user.value = { email, role }
    isAuthenticated.value = true
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  async function login(payload: LoginPayload): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const tokens = await authService.login(payload)
      tokenService.setTokens(tokens.token, tokens.refresh_token)
      decodeUser(tokens.token)
      // Mettre à jour userStore et charger les stores protégés
      const [
        { useUiStore },
        { useUserStore },
        { useRecipeStore },
        { usePlanningStore },
        { useInventoryStore },
        { useShoppingStore },
      ] = await Promise.all([
        import('@/stores/uiStore'),
        import('@/stores/userStore'),
        import('@/stores/recipeStore'),
        import('@/stores/planningStore'),
        import('@/stores/inventoryStore'),
        import('@/stores/shoppingStore'),
      ])
      await Promise.all([
        useUserStore().init(),
        useRecipeStore().init(),
        usePlanningStore().init(),
        useInventoryStore().init(),
        useShoppingStore().init(),
      ])
      useUiStore().navTo('dashboard')
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur de connexion'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function register(payload: RegisterPayload): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      await authService.register(payload)
      const { useUiStore } = await import('@/stores/uiStore')
      useUiStore().navTo('login')
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la création du compte'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    tokenService.clearTokens()
    user.value = null
    isAuthenticated.value = false
    const { useUiStore } = await import('@/stores/uiStore')
    useUiStore().navTo('catalog')
  }

  /** Appelé par httpClient en cas de refresh échoué (pas d'attente de nav) */
  function forceLogout(): void {
    tokenService.clearTokens()
    user.value = null
    isAuthenticated.value = false
    import('@/stores/uiStore').then(({ useUiStore }) => {
      useUiStore().navTo('login')
    })
  }

  /** Appelé au boot de l'app pour tenter de restaurer la session */
  async function tryRefresh(): Promise<void> {
    const refreshToken = tokenService.getRefreshToken()
    if (!refreshToken) return

    // Si le token en cours est encore valide, juste décoder le user
    const existingToken = tokenService.getToken()
    if (existingToken && !tokenService.isTokenExpired(existingToken)) {
      decodeUser(existingToken)
      return
    }

    // Sinon tenter le refresh
    try {
      const tokens = await authService.refresh(refreshToken)
      tokenService.setTokens(tokens.token, tokens.refresh_token)
      decodeUser(tokens.token)
    } catch {
      tokenService.clearTokens()
      user.value = null
      isAuthenticated.value = false
    }
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    currentRole,
    login,
    register,
    logout,
    forceLogout,
    tryRefresh,
  }
})
