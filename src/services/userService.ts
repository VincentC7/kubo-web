import type { User } from '@/types/user'

// Mocké — à remplacer par l'API
let mockUser: User = {
  id: 1,
  name: 'Jean Dupont',
  initials: 'JD',
  role: 'Chef Kubo',
}

export const userService = {
  async getUser(): Promise<User> {
    return { ...mockUser }
  },

  async saveUser(payload: Partial<User>): Promise<User> {
    Object.assign(mockUser, payload)
    return { ...mockUser }
  },
}
