import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { User } from '@/types/user'
import type { UserSettings } from '@/types/settings'

// ── Fixtures (hoisted pour être disponibles dans vi.mock) ─────────────────────

const { mockUser, mockSettings } = vi.hoisted(() => {
  const mockUser: User = {
    id: 'abc-123',
    email: 'jean@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'user',
    roles: ['ROLE_USER'],
  }

  const mockSettings: UserSettings = {
    portionsDefault: 2,
    mealsGoal: 5,
    viewMode: 'week',
    dietaryPrefs: [],
    notifications: { planningReminder: false, expiryAlert: false },
  }

  return { mockUser, mockSettings }
})

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/services/userService', () => ({
  userService: {
    getUser: vi.fn().mockResolvedValue(mockUser),
    getUserFromToken: vi
      .fn()
      .mockReturnValue({ id: '', email: 'jean@example.com', role: 'user', roles: ['ROLE_USER'] }),
    updateProfile: vi.fn().mockImplementation((payload: any) =>
      Promise.resolve({
        firstName: payload.firstName ?? 'Jean',
        lastName: payload.lastName ?? 'Dupont',
        email: 'jean@example.com',
      }),
    ),
    changePassword: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/services/settingsService', () => ({
  settingsService: {
    getSettings: vi.fn().mockResolvedValue({ ...mockSettings }),
    updateSettings: vi
      .fn()
      .mockImplementation((payload: Partial<UserSettings>) =>
        Promise.resolve({ ...mockSettings, ...payload }),
      ),
  },
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({ isAuthenticated: true })),
}))

vi.mock('@/stores/uiStore', () => ({
  useUiStore: vi.fn(() => ({
    setDarkMode: vi.fn(),
    notify: vi.fn(),
  })),
}))

// ── Import après les mocks ────────────────────────────────────────────────────

import { useUserStore } from '@/stores/userStore'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('userStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ── état initial ──────────────────────────────────────────────────────────────

  describe('état initial', () => {
    it('user est null', () => {
      const store = useUserStore()
      expect(store.user).toBeNull()
    })

    it('portions retourne 2 par défaut (pas de settings)', () => {
      const store = useUserStore()
      expect(store.portions).toBe(2)
    })

    it('mealsGoal retourne 5 par défaut', () => {
      const store = useUserStore()
      expect(store.mealsGoal).toBe(5)
    })

    it('viewMode retourne "week" par défaut', () => {
      const store = useUserStore()
      expect(store.viewMode).toBe('week')
    })
  })

  // ── init ──────────────────────────────────────────────────────────────────────

  describe('init', () => {
    it('charge le profil via getUser()', async () => {
      const store = useUserStore()
      await store.init()
      expect(store.user).not.toBeNull()
      expect(store.user!.email).toBe('jean@example.com')
      expect(store.user!.firstName).toBe('Jean')
    })

    it('charge les settings via getSettings()', async () => {
      const store = useUserStore()
      await store.init()
      expect(store.settings).not.toBeNull()
      expect(store.portions).toBe(2)
      expect(store.mealsGoal).toBe(5)
    })

    it('retombe sur getUserFromToken() si getUser() échoue', async () => {
      const { userService } = await import('@/services/userService')
      vi.mocked(userService.getUser).mockRejectedValueOnce({ error: 'Non autorisé' })
      const store = useUserStore()
      await store.init()
      expect(store.user).not.toBeNull()
      expect(store.user!.email).toBe('jean@example.com')
    })

    it("ne charge pas si l'utilisateur n'est pas authentifié", async () => {
      const { useAuthStore } = await import('@/stores/authStore')
      vi.mocked(useAuthStore).mockReturnValueOnce({ isAuthenticated: false } as any)
      const store = useUserStore()
      await store.init()
      expect(store.user).toBeNull()
    })
  })

  // ── updateProfile ─────────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('met à jour firstName et lastName localement', async () => {
      const store = useUserStore()
      await store.init()
      await store.updateProfile({ firstName: 'Marie', lastName: 'Curie' })
      expect(store.user!.firstName).toBe('Marie')
      expect(store.user!.lastName).toBe('Curie')
    })
  })

  // ── updatePortions ────────────────────────────────────────────────────────────

  describe('updatePortions', () => {
    it('incrémente les portions', async () => {
      const store = useUserStore()
      await store.init()
      await store.updatePortions(1)
      expect(store.portions).toBe(3)
    })

    it('décrémente les portions', async () => {
      const store = useUserStore()
      await store.init()
      await store.updatePortions(-1)
      expect(store.portions).toBe(1)
    })

    it('ne descend pas en dessous de 1', async () => {
      const store = useUserStore()
      await store.init()
      await store.updatePortions(-10)
      expect(store.portions).toBeGreaterThanOrEqual(1)
    })
  })

  // ── updateMealsGoal ───────────────────────────────────────────────────────────

  describe('updateMealsGoal', () => {
    it('incrémente mealsGoal', async () => {
      const store = useUserStore()
      await store.init()
      await store.updateMealsGoal(1)
      expect(store.mealsGoal).toBe(6)
    })

    it('ne descend pas en dessous de 1', async () => {
      const store = useUserStore()
      await store.init()
      await store.updateMealsGoal(-10)
      expect(store.mealsGoal).toBeGreaterThanOrEqual(1)
    })
  })

  // ── switchViewMode ────────────────────────────────────────────────────────────

  describe('switchViewMode', () => {
    it('change le viewMode', async () => {
      const store = useUserStore()
      await store.init()
      await store.switchViewMode('list')
      expect(store.viewMode).toBe('list')
    })
  })
})
