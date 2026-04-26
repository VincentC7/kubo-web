/**
 * userService — données de profil + mutations via API.
 *
 * getUserFromToken() : décode l'access token pour obtenir email + rôle.
 * firstName/lastName ne sont PAS dans le JWT Symfony par défaut.
 *
 * getUser()          : GET /user — récupère le profil complet (firstName, lastName, id).
 * updateProfile()    : PATCH /user — modifie firstName et/ou lastName.
 * changePassword()   : POST /user/password — change le mot de passe.
 */
import httpClient from './httpClient'
import { tokenService } from './tokenService'
import type { User, UpdateProfilePayload, ChangePasswordPayload } from '@/types/user'
import type { UserRole } from '@/types/auth'

function mapRole(roles: string[]): UserRole {
  if (roles.includes('ROLE_ADMIN')) return 'admin'
  return 'user'
}

export const userService = {
  getUserFromToken(): Omit<User, 'firstName' | 'lastName'> | null {
    const token = tokenService.getToken()
    if (!token) return null
    const payload = tokenService.decodePayload(token)
    if (!payload) return null

    const roles = payload.roles ?? []
    const role = mapRole(roles)
    const email = payload.username ?? payload.email ?? ''

    return { id: '', email, role, roles }
  },

  async getUser(): Promise<User> {
    try {
      const { data } = await httpClient.get('/user')
      return data.data
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },

  async updateProfile(
    payload: UpdateProfilePayload,
  ): Promise<Pick<User, 'firstName' | 'lastName' | 'email'>> {
    try {
      const response = await httpClient.patch<{
        firstName: string
        lastName: string
        email: string
      }>('/user', payload)
      return response.data
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    try {
      await httpClient.post('/user/password', payload)
    } catch (error: any) {
      throw error.response?.data ?? { error: 'Erreur réseau' }
    }
  },
}
