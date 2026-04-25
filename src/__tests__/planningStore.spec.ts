import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// ── Mock des dépendances externes ────────────────────────────────────────────

// planningService mocké (in-memory par défaut dans l'app, on retourne un objet vide)
vi.mock('@/services/planningService', () => ({
  planningService: {
    getPlanning: vi.fn().mockResolvedValue({}),
    savePlanning: vi.fn().mockResolvedValue(undefined),
  },
}))

// uiStore.notify() mocké pour capturer les toasts sans UI
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
  })),
}))

// recipeStore mocké avec quelques recettes de test
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
  })

  // ── weekKey ──────────────────────────────────────────────────────────────────

  describe('weekKey', () => {
    it('a le format YYYY-WN', () => {
      const store = usePlanningStore()
      expect(store.weekKey).toMatch(/^\d{4}-W\d+$/)
    })

    it("change quand on avance d'une semaine", () => {
      const store = usePlanningStore()
      const before = store.weekKey
      store.changePeriod(1)
      expect(store.weekKey).not.toBe(before)
    })

    it('revient à la semaine initiale après +1 puis -1', () => {
      const store = usePlanningStore()
      const initial = store.weekKey
      store.changePeriod(1)
      store.changePeriod(-1)
      expect(store.weekKey).toBe(initial)
    })
  })

  // ── toggleRecipe ─────────────────────────────────────────────────────────────

  describe('toggleRecipe', () => {
    it('sélectionne une recette non sélectionnée', () => {
      const store = usePlanningStore()
      expect(store.isSelected('1')).toBe(false)
      store.toggleRecipe('1')
      expect(store.isSelected('1')).toBe(true)
    })

    it('désélectionne une recette déjà sélectionnée', () => {
      const store = usePlanningStore()
      store.toggleRecipe('1')
      store.toggleRecipe('1')
      expect(store.isSelected('1')).toBe(false)
    })

    it('reset done à false lors de la désélection', () => {
      const store = usePlanningStore()
      store.toggleRecipe('1')
      store.markAsDone('1')
      expect(store.isDone('1')).toBe(true)
      store.toggleRecipe('1') // désélectionne
      expect(store.isDone('1')).toBe(false)
    })

    it('peut sélectionner plusieurs recettes indépendamment', () => {
      const store = usePlanningStore()
      store.toggleRecipe('1')
      store.toggleRecipe('2')
      expect(store.isSelected('1')).toBe(true)
      expect(store.isSelected('2')).toBe(true)
      expect(store.isSelected('3')).toBe(false)
    })
  })

  // ── markAsDone ───────────────────────────────────────────────────────────────

  describe('markAsDone', () => {
    it('marque une recette sélectionnée comme faite', () => {
      const store = usePlanningStore()
      store.toggleRecipe('1')
      store.markAsDone('1')
      expect(store.isDone('1')).toBe(true)
    })

    it('toggle : marquer fait puis démarquer', () => {
      const store = usePlanningStore()
      store.toggleRecipe('1')
      store.markAsDone('1')
      store.markAsDone('1')
      expect(store.isDone('1')).toBe(false)
    })

    it("ne fait rien si la recette n'est pas dans les entrées de la semaine", () => {
      const store = usePlanningStore()
      // '999' n'a jamais été toggleé → aucune entrée
      expect(() => store.markAsDone('999')).not.toThrow()
      expect(store.isDone('999')).toBe(false)
    })
  })

  // ── selectedRecipes ──────────────────────────────────────────────────────────

  describe('selectedRecipes', () => {
    it('est vide au départ', () => {
      const store = usePlanningStore()
      expect(store.selectedRecipes).toHaveLength(0)
    })

    it('contient les recettes sélectionnées', () => {
      const store = usePlanningStore()
      store.toggleRecipe('1')
      store.toggleRecipe('3')
      expect(store.selectedRecipes).toHaveLength(2)
      expect(store.selectedRecipes.map((r) => r.id)).toContain('1')
      expect(store.selectedRecipes.map((r) => r.id)).toContain('3')
    })

    it('exclut les recettes désélectionnées', () => {
      const store = usePlanningStore()
      store.toggleRecipe('1')
      store.toggleRecipe('2')
      store.toggleRecipe('1') // désélectionne
      expect(store.selectedRecipes).toHaveLength(1)
      expect(store.selectedRecipes[0].id).toBe('2')
    })
  })

  // ── nutritionTotals ──────────────────────────────────────────────────────────

  describe('nutritionTotals', () => {
    it('retourne des valeurs par défaut si aucune recette sélectionnée', () => {
      const store = usePlanningStore()
      // Comportement actuel documenté (valeurs fictives)
      expect(store.nutritionTotals).toEqual({ prot: 30, fat: 30, carb: 40 })
    })

    it('calcule correctement la somme des macros des recettes sélectionnées', () => {
      const store = usePlanningStore()
      // Recette 1 : prot=5, fat=3, carb=15
      // Recette 2 : prot=10, fat=5, carb=40
      store.toggleRecipe('1')
      store.toggleRecipe('2')
      expect(store.nutritionTotals).toEqual({ prot: 15, fat: 8, carb: 55 })
    })

    it('ne compte pas les recettes désélectionnées', () => {
      const store = usePlanningStore()
      store.toggleRecipe('1')
      store.toggleRecipe('2')
      store.toggleRecipe('2') // retire recette 2
      // Seulement recette 1 : prot=5, fat=3, carb=15
      expect(store.nutritionTotals).toEqual({ prot: 5, fat: 3, carb: 15 })
    })
  })

  // ── totalPrice / avgPrice ────────────────────────────────────────────────────

  describe('totalPrice et avgPrice', () => {
    it('totalPrice est 0 si aucune recette sélectionnée', () => {
      const store = usePlanningStore()
      expect(store.totalPrice).toBe(0)
    })

    it('totalPrice est la somme des prix des recettes sélectionnées', () => {
      const store = usePlanningStore()
      // Recette 1 : 10€, Recette 3 : 6€
      store.toggleRecipe('1')
      store.toggleRecipe('3')
      expect(store.totalPrice).toBe(16)
    })

    it('avgPrice est 0 si aucune recette sélectionnée', () => {
      const store = usePlanningStore()
      expect(store.avgPrice).toBe(0)
    })

    it('avgPrice est la moyenne des prix des recettes sélectionnées', () => {
      const store = usePlanningStore()
      // Recette 1 : 10€, Recette 2 : 8€ → moy = 9€
      store.toggleRecipe('1')
      store.toggleRecipe('2')
      expect(store.avgPrice).toBe(9)
    })
  })

  // ── clearPlanning ────────────────────────────────────────────────────────────

  describe('clearPlanning', () => {
    it('vide les recettes sélectionnées de la semaine courante', () => {
      const store = usePlanningStore()
      store.toggleRecipe('1')
      store.toggleRecipe('2')
      expect(store.selectedRecipes).toHaveLength(2)
      store.clearPlanning()
      expect(store.selectedRecipes).toHaveLength(0)
    })

    it('ne touche pas aux données des autres semaines', () => {
      const store = usePlanningStore()
      store.toggleRecipe('1')
      const initialKey = store.weekKey
      store.changePeriod(1) // semaine suivante
      store.toggleRecipe('2')
      store.changePeriod(-1) // retour semaine initiale
      store.clearPlanning() // clear semaine initiale
      expect(store.isSelected('1')).toBe(false)
      // Aller sur la semaine suivante : recette 2 doit toujours être sélectionnée
      store.changePeriod(1)
      expect(store.isSelected('2')).toBe(true)
      // Nettoyage
      store.changePeriod(-1)
      void initialKey
    })
  })

  // ── doneRecipes ──────────────────────────────────────────────────────────────

  describe('doneRecipes', () => {
    it('est vide si aucune recette marquée comme faite', () => {
      const store = usePlanningStore()
      store.toggleRecipe('1')
      expect(store.doneRecipes).toHaveLength(0)
    })

    it('contient uniquement les recettes marquées comme faites', () => {
      const store = usePlanningStore()
      store.toggleRecipe('1')
      store.toggleRecipe('2')
      store.markAsDone('1')
      expect(store.doneRecipes).toHaveLength(1)
      expect(store.doneRecipes[0].id).toBe('1')
    })
  })
})
