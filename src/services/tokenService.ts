import type { JwtPayload } from '@/types/auth'

const TOKEN_KEY = 'kubo_token'
const REFRESH_KEY = 'kubo_refresh_token'

function decodePayload(token: string): JwtPayload | null {
  try {
    const base64 = token.split('.')[1]
    return JSON.parse(atob(base64)) as JwtPayload
  } catch {
    return null
  }
}

export const tokenService = {
  setTokens(token: string, refreshToken: string): void {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(REFRESH_KEY, refreshToken)
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY)
  },

  clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },

  isTokenExpired(token?: string | null): boolean {
    const t = token ?? localStorage.getItem(TOKEN_KEY)
    if (!t) return true
    const payload = decodePayload(t)
    if (!payload) return true
    // Marge de 30 secondes pour le refresh proactif
    return payload.exp * 1000 < Date.now() + 30_000
  },

  decodePayload,
}
