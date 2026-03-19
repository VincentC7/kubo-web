import type { User } from '@/types/user'

// Mocké — pas d'endpoint utilisateur disponible pour l'instant
const MOCK_USER: User = {
  id: 1,
  name: 'Jean Dupont',
  initials: 'JD',
  role: 'Chef Kubo',
  goalKcal: 2000,
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
}

export const userService = {
  async getUser(): Promise<User> {
    return { ...MOCK_USER }
  },

  async saveUser(payload: Partial<User>): Promise<User> {
    Object.assign(MOCK_USER, payload)
    return { ...MOCK_USER }
  },
}
