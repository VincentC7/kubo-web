import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { PlanningEntry, PlanningResponse } from '@/types/planning'

// ── Helpers ──────────────────────────────────────────────────────────────────

let mockEntries: PlanningEntry[] = []
let nextId = 1

function makeEntry(recetteId: string, overrides?: Partial<PlanningEntry>): PlanningEntry {
  return {
    id: String(nextId++),
    recette: { id: recetteId, nom: 'Recette', tempsTotal: 30, difficulte: 'Facile' },
    week: '2026-W18',
    portions: 2,
    done: false,
    ...overrides,
  }
}

// ── Mock planningService — simule le back en mémoire ─────────────────────────

vi.mock('@/services/planningService', () => ({
  planningService: {
    getPlanning: vi.fn().mockImplementation(
      (): Promise<PlanningResponse> =>
        Promise.resolve({
          data: mockEntries,
          meta: { week: '2026-W18', weekStart: '2026-04-27', weekEnd: '2026-05-03' },
        }),
    ),
    addEntry: vi
      .fn()
      .mockImplementation(
        (payload: {
          recetteId: string
          week: string
          portions: number
        }): Promise<PlanningEntry> => {
          const entry = makeEntry(payload.recetteId, {
            week: payload.week,
            portions: payload.portions,
          })
          mockEntries.push(entry)
          return Promise.resolve(entry)
        },
      ),
    updateEntry: vi
      .fn()
      .mockImplementation((id: string, payload: Partial<PlanningEntry>): Promise<PlanningEntry> => {
        const entry = mockEntries.find((e) => e.id === id)!
        Object.assign(entry, payload)
        return Promise.resolve(entry)
      }),
    removeEntry: vi.fn().mockImplementation((id: string): Promise<void> => {
      mockEntries = mockEntries.filter((e) => e.id !== id)
      return Promise.resolve()
    }),
  },
}))

// ── Mock uiStore ──────────────────────────────────────────────────────────────

vi.mock('@/stores/uiStore', () => ({
  useUiStore: vi.fn(() => ({
    notify: vi.fn(),
    navTo: vi.fn(),
    currentView: 'dashboard',
    sidebarCollapsed: false,
    darkMode: false,
    toastMessage: '',
    toastVisible: false,
    showInventory: true,
    showGroceries: true,
    setDarkMode: vi.fn(),
  })),
}))

// ── Mock userStore ────────────────────────────────────────────────────────────

vi.mock('@/stores/userStore', () => ({
  useUserStore: vi.fn(() => ({ portions: 2 })),
}))

// ── Mock recipeStore ──────────────────────────────────────────────────────────

vi.mock('@/stores/recipeStore', () => ({
  useRecipeStore: vi.fn(() => ({
    recipesWithPrice: [
      { id: '1', name: 'Salade', totalPrice: 10, prot: 5, fat: 3, carb: 15 },
      { id: '2', name: 'Pasta', totalPrice: 8, prot: 10, fat: 5, carb: 40 },
      { id: '3', name: 'Soupe', totalPrice: 6, prot: 3, fat: 2, carb: 10 },
    ],
  })),
}))

// ── Import du store après les mocks ──────────────────────────────────────────

import { usePlanningStore } from '@/stores/planningStore'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('planningStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockEntries = []
    nextId = 1
  })

  // ── weekKey ──────────────────────────────────────────────────────────────────

  describe('weekKey', () => {
    it('a le format YYYY-WN', () => {
      const store = usePlanningStore()
      expect(store.weekKey).toMatch(/^\d{4}-W\d+$/)
    })

    it("change quand on avance d'une semaine", async () => {
      const store = usePlanningStore()
      const before = store.weekKey
      await store.changePeriod(1)
      expect(store.weekKey).not.toBe(before)
    })

    it('revient à la semaine initiale après +1 puis -1', async () => {
      const store = usePlanningStore()
      const initial = store.weekKey
      await store.changePeriod(1)
      await store.changePeriod(-1)
      expect(store.weekKey).toBe(initial)
    })
  })

  // ── toggleRecipe ─────────────────────────────────────────────────────────────

  describe('toggleRecipe', () => {
    it('sélectionne une recette non sélectionnée', async () => {
      const store = usePlanningStore()
      expect(store.isSelected('1')).toBe(false)
      await store.toggleRecipe('1')
      expect(store.isSelected('1')).toBe(true)
    })

    it('désélectionne une recette déjà sélectionnée', async () => {
      const store = usePlanningStore()
      await store.toggleRecipe('1')
      await store.toggleRecipe('1')
      expect(store.isSelected('1')).toBe(false)
    })

    it('reset done à false lors de la désélection', async () => {
      const store = usePlanningStore()
      await store.toggleRecipe('1')
      await store.markAsDone('1')
      expect(store.isDone('1')).toBe(true)
      await store.toggleRecipe('1') // désélectionne
      expect(store.isDone('1')).toBe(false)
    })

    it('peut sélectionner plusieurs recettes indépendamment', async () => {
      const store = usePlanningStore()
      await store.toggleRecipe('1')
      await store.toggleRecipe('2')
      expect(store.isSelected('1')).toBe(true)
      expect(store.isSelected('2')).toBe(true)
      expect(store.isSelected('3')).toBe(false)
    })
  })

  // ── markAsDone ───────────────────────────────────────────────────────────────

  describe('markAsDone', () => {
    it('marque une recette sélectionnée comme faite', async () => {
      const store = usePlanningStore()
      await store.toggleRecipe('1')
      await store.markAsDone('1')
      expect(store.isDone('1')).toBe(true)
    })

    it('toggle : marquer fait puis démarquer', async () => {
      const store = usePlanningStore()
      await store.toggleRecipe('1')
      await store.markAsDone('1')
      await store.markAsDone('1')
      expect(store.isDone('1')).toBe(false)
    })

    it("ne fait rien si la recette n'est pas dans les entrées de la semaine", async () => {
      const store = usePlanningStore()
      await expect(store.markAsDone('999')).resolves.not.toThrow()
      expect(store.isDone('999')).toBe(false)
    })
  })

  // ── selectedRecipes ──────────────────────────────────────────────────────────

  describe('selectedRecipes', () => {
    it('est vide au départ', () => {
      const store = usePlanningStore()
      expect(store.selectedRecipes).toHaveLength(0)
    })

    it('contient les recettes sélectionnées', async () => {
      const store = usePlanningStore()
      await store.toggleRecipe('1')
      await store.toggleRecipe('3')
      expect(store.selectedRecipes).toHaveLength(2)
      expect(store.selectedRecipes.map((r) => r.id)).toContain('1')
      expect(store.selectedRecipes.map((r) => r.id)).toContain('3')
    })

    it('exclut les recettes désélectionnées', async () => {
      const store = usePlanningStore()
      await store.toggleRecipe('1')
      await store.toggleRecipe('2')
      await store.toggleRecipe('1') // désélectionne
      expect(store.selectedRecipes).toHaveLength(1)
      expect(store.selectedRecipes[0].id).toBe('2')
    })
  })

  // ── nutritionTotals ──────────────────────────────────────────────────────────

  describe('nutritionTotals', () => {
    it('retourne null si aucune recette sélectionnée', () => {
      const store = usePlanningStore()
      expect(store.nutritionTotals).toBeNull()
    })

    it('calcule correctement la somme des macros des recettes sélectionnées', async () => {
      const store = usePlanningStore()
      await store.toggleRecipe('1')
      await store.toggleRecipe('2')
      expect(store.nutritionTotals).toEqual({ prot: 15, fat: 8, carb: 55 })
    })

    it('ne compte pas les recettes désélectionnées', async () => {
      const store = usePlanningStore()
      await store.toggleRecipe('1')
      await store.toggleRecipe('2')
      await store.toggleRecipe('2') // retire recette 2
      expect(store.nutritionTotals).toEqual({ prot: 5, fat: 3, carb: 15 })
    })
  })

  // ── totalPrice / avgPrice ────────────────────────────────────────────────────

  describe('totalPrice et avgPrice', () => {
    it('totalPrice est 0 si aucune recette sélectionnée', () => {
      const store = usePlanningStore()
      expect(store.totalPrice).toBe(0)
    })

    it('totalPrice est la somme des prix des recettes sélectionnées', async () => {
      const store = usePlanningStore()
      await store.toggleRecipe('1')
      await store.toggleRecipe('3')
      expect(store.totalPrice).toBe(16)
    })

    it('avgPrice est 0 si aucune recette sélectionnée', () => {
      const store = usePlanningStore()
      expect(store.avgPrice).toBe(0)
    })

    it('avgPrice est la moyenne des prix des recettes sélectionnées', async () => {
      const store = usePlanningStore()
      await store.toggleRecipe('1')
      await store.toggleRecipe('2')
      expect(store.avgPrice).toBe(9)
    })
  })

  // ── clearPlanning ────────────────────────────────────────────────────────────

  describe('clearPlanning', () => {
    it('vide les recettes sélectionnées', async () => {
      const store = usePlanningStore()
      await store.toggleRecipe('1')
      await store.toggleRecipe('2')
      expect(store.selectedRecipes).toHaveLength(2)
      await store.clearPlanning()
      expect(store.selectedRecipes).toHaveLength(0)
    })
  })

  // ── doneRecipes ──────────────────────────────────────────────────────────────

  describe('doneRecipes', () => {
    it('est vide si aucune recette marquée comme faite', async () => {
      const store = usePlanningStore()
      await store.toggleRecipe('1')
      expect(store.doneRecipes).toHaveLength(0)
    })

    it('contient uniquement les recettes marquées comme faites', async () => {
      const store = usePlanningStore()
      await store.toggleRecipe('1')
      await store.toggleRecipe('2')
      await store.markAsDone('1')
      expect(store.doneRecipes).toHaveLength(1)
      expect(store.doneRecipes[0].id).toBe('1')
    })
  })
})
