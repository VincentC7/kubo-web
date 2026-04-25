import httpClient from './httpClient'
import type { LoginPayload, RegisterPayload, AuthTokens } from '@/types/auth'

export const authService = {
  async login(payload: LoginPayload): Promise<AuthTokens> {
    const response = await httpClient.post<AuthTokens>('/login', payload)
    return response.data
  },

  async register(payload: RegisterPayload): Promise<void> {
    await httpClient.post('/register', payload)
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const response = await httpClient.post<AuthTokens>('/token/refresh', {
      refresh_token: refreshToken,
    })
    return response.data
  },
}
