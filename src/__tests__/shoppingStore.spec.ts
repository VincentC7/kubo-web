import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { ShoppingList, ShoppingItem } from '@/types/shopping'

// ── Helpers ───────────────────────────────────────────────────────────────────

let mockList: ShoppingList | null = null
let nextId = 1

function makeItem(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: String(nextId++),
    ingredientName: 'Tomate',
    quantity: 2,
    unit: 'kg',
    category: 'Légumes',
    checked: false,
    source: 'planning',
    ...overrides,
  }
}

function makeList(items: ShoppingItem[] = []): ShoppingList {
  return { id: 'list-1', week: '2026-W18', items }
}

// ── Mock shoppingService ──────────────────────────────────────────────────────

vi.mock('@/services/shoppingService', () => ({
  shoppingService: {
    getList: vi.fn().mockImplementation(() => Promise.resolve({ data: mockList })),
    generateFromPlanning: vi.fn().mockImplementation(() => {
      mockList = makeList([
        makeItem({ ingredientName: 'Carotte', category: 'Légumes' }),
        makeItem({ ingredientName: 'Farine', category: 'Épicerie' }),
      ])
      return Promise.resolve(mockList)
    }),
    addItem: vi.fn().mockImplementation((payload: any) => {
      const item = makeItem({ ingredientName: payload.ingredientName, category: payload.category })
      // Ne pas push dans mockList : le store gère lui-même l'ajout dans list.value.items
      return Promise.resolve(item)
    }),
    updateItem: vi.fn().mockImplementation((id: string, payload: any) => {
      const item = mockList?.items.find((i) => i.id === id)!
      Object.assign(item, payload)
      return Promise.resolve(item)
    }),
    removeItem: vi.fn().mockImplementation((id: string) => {
      if (mockList) mockList.items = mockList.items.filter((i) => i.id !== id)
      return Promise.resolve()
    }),
    clearList: vi.fn().mockImplementation(() => {
      if (mockList) mockList.items = []
      return Promise.resolve()
    }),
  },
}))

// ── Mock planningStore ────────────────────────────────────────────────────────

vi.mock('@/stores/planningStore', () => ({
  usePlanningStore: vi.fn(() => ({ weekKey: '2026-W18' })),
}))

// ── Mock uiStore ──────────────────────────────────────────────────────────────

vi.mock('@/stores/uiStore', () => ({
  useUiStore: vi.fn(() => ({ notify: vi.fn() })),
}))

// ── Import après les mocks ────────────────────────────────────────────────────

import { useShoppingStore } from '@/stores/shoppingStore'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('shoppingStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockList = null
    nextId = 1
  })

  // ── état initial ─────────────────────────────────────────────────────────────

  describe('état initial', () => {
    it('list est null', () => {
      const store = useShoppingStore()
      expect(store.list).toBeNull()
    })

    it('checkedCount et totalCount sont 0', () => {
      const store = useShoppingStore()
      expect(store.checkedCount).toBe(0)
      expect(store.totalCount).toBe(0)
    })

    it('itemsByCategory est vide', () => {
      const store = useShoppingStore()
      expect(store.itemsByCategory).toEqual({})
    })
  })

  // ── fetchList ─────────────────────────────────────────────────────────────────

  describe('fetchList', () => {
    it('charge la liste depuis le service', async () => {
      mockList = makeList([makeItem()])
      const store = useShoppingStore()
      await store.fetchList()
      expect(store.list).not.toBeNull()
      expect(store.totalCount).toBe(1)
    })

    it('list est null si le service retourne null', async () => {
      mockList = null
      const store = useShoppingStore()
      await store.fetchList()
      expect(store.list).toBeNull()
    })

    it('loading passe à false après le chargement', async () => {
      mockList = makeList()
      const store = useShoppingStore()
      await store.fetchList()
      expect(store.loading).toBe(false)
    })

    it("stocke l'erreur si le service échoue", async () => {
      const { shoppingService } = await import('@/services/shoppingService')
      vi.mocked(shoppingService.getList).mockRejectedValueOnce({ error: 'Erreur réseau' })
      const store = useShoppingStore()
      await store.fetchList()
      expect(store.error).toBe('Erreur réseau')
    })
  })

  // ── generate ──────────────────────────────────────────────────────────────────

  describe('generate', () => {
    it('génère la liste depuis le planning', async () => {
      const store = useShoppingStore()
      await store.generate()
      expect(store.list).not.toBeNull()
      expect(store.totalCount).toBe(2)
    })

    it('contient les items générés', async () => {
      const store = useShoppingStore()
      await store.generate()
      const names = store.list!.items.map((i) => i.ingredientName)
      expect(names).toContain('Carotte')
      expect(names).toContain('Farine')
    })

    it('loading est false après génération', async () => {
      const store = useShoppingStore()
      await store.generate()
      expect(store.loading).toBe(false)
    })
  })

  // ── addItem ───────────────────────────────────────────────────────────────────

  describe('addItem', () => {
    it('ajoute un item à la liste existante', async () => {
      mockList = makeList()
      const store = useShoppingStore()
      await store.fetchList()
      await store.addItem({ week: '2026-W18', ingredientName: 'Oignon', category: 'Légumes' })
      expect(store.totalCount).toBe(1)
      expect(store.list!.items[0].ingredientName).toBe('Oignon')
    })

    it("n'ajoute pas si list est null", async () => {
      const store = useShoppingStore()
      // list est null, pas de crash
      await expect(
        store.addItem({ week: '2026-W18', ingredientName: 'Oignon' }),
      ).resolves.not.toThrow()
    })
  })

  // ── toggleItem ────────────────────────────────────────────────────────────────

  describe('toggleItem', () => {
    it('coche un item non coché', async () => {
      mockList = makeList([makeItem({ id: '1', checked: false })])
      const store = useShoppingStore()
      await store.fetchList()
      await store.toggleItem('1')
      expect(store.list!.items[0].checked).toBe(true)
    })

    it('décoche un item coché', async () => {
      mockList = makeList([makeItem({ id: '1', checked: true })])
      const store = useShoppingStore()
      await store.fetchList()
      await store.toggleItem('1')
      expect(store.list!.items[0].checked).toBe(false)
    })

    it('checkedCount se met à jour', async () => {
      mockList = makeList([makeItem({ id: '1' }), makeItem({ id: '2' })])
      const store = useShoppingStore()
      await store.fetchList()
      expect(store.checkedCount).toBe(0)
      await store.toggleItem('1')
      expect(store.checkedCount).toBe(1)
      await store.toggleItem('2')
      expect(store.checkedCount).toBe(2)
    })

    it("ne fait rien si l'id n'existe pas", async () => {
      mockList = makeList([makeItem({ id: '1' })])
      const store = useShoppingStore()
      await store.fetchList()
      await expect(store.toggleItem('999')).resolves.not.toThrow()
    })
  })

  // ── removeItem ────────────────────────────────────────────────────────────────

  describe('removeItem', () => {
    it('supprime un item de la liste', async () => {
      mockList = makeList([makeItem({ id: '1' }), makeItem({ id: '2' })])
      const store = useShoppingStore()
      await store.fetchList()
      await store.removeItem('1')
      expect(store.totalCount).toBe(1)
      expect(store.list!.items[0].id).toBe('2')
    })
  })

  // ── clearList ─────────────────────────────────────────────────────────────────

  describe('clearList', () => {
    it('vide tous les items', async () => {
      mockList = makeList([makeItem(), makeItem(), makeItem()])
      const store = useShoppingStore()
      await store.fetchList()
      expect(store.totalCount).toBe(3)
      await store.clearList()
      expect(store.totalCount).toBe(0)
    })
  })

  // ── itemsByCategory ───────────────────────────────────────────────────────────

  describe('itemsByCategory', () => {
    it('groupe les items par catégorie', async () => {
      mockList = makeList([
        makeItem({ id: '1', category: 'Légumes' }),
        makeItem({ id: '2', category: 'Légumes' }),
        makeItem({ id: '3', category: 'Épicerie' }),
      ])
      const store = useShoppingStore()
      await store.fetchList()
      expect(store.itemsByCategory['Légumes']).toHaveLength(2)
      expect(store.itemsByCategory['Épicerie']).toHaveLength(1)
    })

    it('utilise "Autre" si la catégorie est null', async () => {
      mockList = makeList([makeItem({ id: '1', category: null })])
      const store = useShoppingStore()
      await store.fetchList()
      expect(store.itemsByCategory['Autre']).toHaveLength(1)
    })
  })
})
