import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { tokenService } from './tokenService'

const httpClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
})

// ── Request interceptor ──────────────────────────────────────────────────────
// Injecte X-Api-Key sur toutes les requêtes + Bearer si token présent
httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const apiKey = import.meta.env.VITE_API_KEY
  if (apiKey) {
    config.headers['X-Api-Key'] = apiKey
  }

  const token = tokenService.getToken()
  if (token && !tokenService.isTokenExpired(token)) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  return config
})

// ── Response interceptor ─────────────────────────────────────────────────────
// Sur 401 : tente un refresh, rejoue la requête, sinon logout
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

function processQueue(token: string) {
  refreshQueue.forEach((resolve) => resolve(token))
  refreshQueue = []
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Erreur non-401 ou requête de refresh elle-même → rejet direct
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/token/refresh') ||
      originalRequest.url?.includes('/login')
    ) {
      const message: string =
        error.response?.data?.error ??
        error.response?.data?.message ??
        error.message ??
        'Erreur réseau'
      return Promise.reject(new Error(message))
    }

    originalRequest._retry = true

    const refreshToken = tokenService.getRefreshToken()
    if (!refreshToken) {
      return handleLogout()
    }

    if (isRefreshing) {
      // File d'attente si un refresh est déjà en cours
      return new Promise<string>((resolve) => {
        refreshQueue.push(resolve)
      }).then((newToken) => {
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        return httpClient(originalRequest)
      })
    }

    isRefreshing = true

    try {
      const { data } = await httpClient.post<{ token: string; refresh_token: string }>(
        '/token/refresh',
        { refresh_token: refreshToken },
      )
      tokenService.setTokens(data.token, data.refresh_token)
      processQueue(data.token)
      originalRequest.headers['Authorization'] = `Bearer ${data.token}`
      return httpClient(originalRequest)
    } catch {
      tokenService.clearTokens()
      processQueue('')
      return handleLogout()
    } finally {
      isRefreshing = false
    }
  },
)

function handleLogout(): Promise<never> {
  tokenService.clearTokens()
  // Import dynamique pour éviter les dépendances circulaires
  import('@/stores/authStore').then(({ useAuthStore }) => {
    const store = useAuthStore()
    store.forceLogout()
  })
  return Promise.reject(new Error('Session expirée. Veuillez vous reconnecter.'))
}

export default httpClient
