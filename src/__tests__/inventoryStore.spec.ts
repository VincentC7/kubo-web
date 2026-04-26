import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { InventoryItem, InventoryResponse } from '@/types/inventory'

// ── Helpers ───────────────────────────────────────────────────────────────────

let mockItems: InventoryItem[] = []
let nextId = 1

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: String(nextId++),
    name: 'Tomate',
    quantity: 500,
    unit: 'g',
    category: 'Légumes',
    expiresAt: null,
    daysUntilExpiry: null,
    status: 'ok',
    ...overrides,
  }
}

function makeResponse(items: InventoryItem[] = []): InventoryResponse {
  return {
    data: items,
    meta: { total: items.length, expiringSoon: 0, expired: 0 },
  }
}

// ── Mock inventoryService ─────────────────────────────────────────────────────

vi.mock('@/services/inventoryService', () => ({
  inventoryService: {
    getInventory: vi.fn().mockImplementation(() => Promise.resolve(makeResponse(mockItems))),
    addItem: vi.fn().mockImplementation((payload: any) => {
      const item = makeItem({
        name: payload.name,
        quantity: payload.quantity,
        category: payload.category,
      })
      mockItems.push(item)
      return Promise.resolve(item)
    }),
    updateItem: vi.fn().mockImplementation((id: string, payload: any) => {
      const item = mockItems.find((i) => i.id === id)!
      Object.assign(item, payload)
      return Promise.resolve(item)
    }),
    removeItem: vi.fn().mockImplementation((id: string) => {
      mockItems = mockItems.filter((i) => i.id !== id)
      return Promise.resolve()
    }),
  },
}))

// ── Mock uiStore ──────────────────────────────────────────────────────────────

vi.mock('@/stores/uiStore', () => ({
  useUiStore: vi.fn(() => ({ notify: vi.fn() })),
}))

// ── Import après les mocks ────────────────────────────────────────────────────

import { useInventoryStore } from '@/stores/inventoryStore'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('inventoryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockItems = []
    nextId = 1
  })

  // ── état initial ──────────────────────────────────────────────────────────────

  describe('état initial', () => {
    it('items est vide', () => {
      const store = useInventoryStore()
      expect(store.items).toHaveLength(0)
    })

    it('expiringSoon et expired sont vides', () => {
      const store = useInventoryStore()
      expect(store.expiringSoon).toHaveLength(0)
      expect(store.expired).toHaveLength(0)
    })
  })

  // ── fetchInventory ────────────────────────────────────────────────────────────

  describe('fetchInventory', () => {
    it('charge les items depuis le service', async () => {
      mockItems = [makeItem(), makeItem()]
      const store = useInventoryStore()
      await store.fetchInventory()
      expect(store.items).toHaveLength(2)
    })

    it('loading est false après le chargement', async () => {
      const store = useInventoryStore()
      await store.fetchInventory()
      expect(store.loading).toBe(false)
    })

    it("stocke l'erreur si le service échoue", async () => {
      const { inventoryService } = await import('@/services/inventoryService')
      vi.mocked(inventoryService.getInventory).mockRejectedValueOnce({ error: 'Erreur réseau' })
      const store = useInventoryStore()
      await store.fetchInventory()
      expect(store.error).toBe('Erreur réseau')
    })
  })

  // ── addItem ───────────────────────────────────────────────────────────────────

  describe('addItem', () => {
    it('ajoute un item et met à jour la liste', async () => {
      const store = useInventoryStore()
      await store.addItem({ name: 'Carotte', quantity: 3, category: 'Légumes' })
      expect(store.items).toHaveLength(1)
      expect(store.items[0].name).toBe('Carotte')
    })

    it('peut ajouter plusieurs items', async () => {
      const store = useInventoryStore()
      await store.addItem({ name: 'Carotte', quantity: 3 })
      await store.addItem({ name: 'Farine', quantity: 1 })
      expect(store.items).toHaveLength(2)
    })
  })

  // ── updateItem ────────────────────────────────────────────────────────────────

  describe('updateItem', () => {
    it('met à jour un item existant', async () => {
      mockItems = [makeItem({ id: '1', quantity: 100 })]
      const store = useInventoryStore()
      await store.fetchInventory()
      await store.updateItem('1', { quantity: 200 })
      expect(store.items[0].quantity).toBe(200)
    })

    it('ne modifie pas les autres items', async () => {
      mockItems = [makeItem({ id: '1', name: 'A' }), makeItem({ id: '2', name: 'B' })]
      const store = useInventoryStore()
      await store.fetchInventory()
      await store.updateItem('1', { name: 'A modifié' })
      expect(store.items[1].name).toBe('B')
    })
  })

  // ── removeItem ────────────────────────────────────────────────────────────────

  describe('removeItem', () => {
    it('supprime un item de la liste', async () => {
      mockItems = [makeItem({ id: '1' }), makeItem({ id: '2' })]
      const store = useInventoryStore()
      await store.fetchInventory()
      await store.removeItem('1')
      expect(store.items).toHaveLength(1)
      expect(store.items[0].id).toBe('2')
    })
  })

  // ── expiringSoon / expired ────────────────────────────────────────────────────

  describe('expiringSoon et expired', () => {
    it('expiringSoon filtre les items avec status expiring_soon', async () => {
      mockItems = [
        makeItem({ id: '1', status: 'ok' }),
        makeItem({ id: '2', status: 'expiring_soon' }),
        makeItem({ id: '3', status: 'expiring_soon' }),
      ]
      const store = useInventoryStore()
      await store.fetchInventory()
      expect(store.expiringSoon).toHaveLength(2)
    })

    it('expired filtre les items avec status expired', async () => {
      mockItems = [makeItem({ id: '1', status: 'ok' }), makeItem({ id: '2', status: 'expired' })]
      const store = useInventoryStore()
      await store.fetchInventory()
      expect(store.expired).toHaveLength(1)
      expect(store.expired[0].id).toBe('2')
    })
  })

  // ── itemsByCategory ───────────────────────────────────────────────────────────

  describe('itemsByCategory', () => {
    it('groupe correctement par catégorie', async () => {
      mockItems = [
        makeItem({ id: '1', category: 'Légumes' }),
        makeItem({ id: '2', category: 'Légumes' }),
        makeItem({ id: '3', category: 'Frais' }),
      ]
      const store = useInventoryStore()
      await store.fetchInventory()
      expect(store.itemsByCategory['Légumes']).toHaveLength(2)
      expect(store.itemsByCategory['Frais']).toHaveLength(1)
    })

    it('utilise "Autre" pour les items sans catégorie', async () => {
      mockItems = [makeItem({ id: '1', category: null })]
      const store = useInventoryStore()
      await store.fetchInventory()
      expect(store.itemsByCategory['Autre']).toHaveLength(1)
    })
  })
})
