/**
 * userService — données de profil + mutations via API.
 *
 * getUserFromToken() : décode l'access token pour obtenir email + rôle.
 * firstName/lastName ne sont PAS dans le JWT Symfony par défaut —
 * ils sont stockés séparément dans le userStore après un appel PATCH ou
 * récupérés depuis la réponse du profil si l'API les expose.
 *
 * updateProfile() : PATCH /user — modifie firstName et/ou lastName.
 * changePassword() : POST /user/password — change le mot de passe.
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

    const role = mapRole(payload.roles ?? [])
    const email = payload.username ?? payload.email ?? ''

    return { id: 0, email, role }
  },

  async updateProfile(
    payload: UpdateProfilePayload,
  ): Promise<Pick<User, 'firstName' | 'lastName' | 'email'>> {
    const response = await httpClient.patch<{ firstName: string; lastName: string; email: string }>(
      '/user',
      payload,
    )
    return response.data
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await httpClient.post('/user/password', payload)
  },
}
