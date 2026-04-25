import { describe, it, expect } from 'vitest'
import { getSeasonStatus } from '@/composables/useSeason'

describe('getSeasonStatus', () => {
  // ── Cas sans données ─────────────────────────────────────────────────────────

  it('retourne null si moisSaison est null', () => {
    expect(getSeasonStatus(null, 6)).toBeNull()
  })

  it('retourne null si moisSaison est undefined', () => {
    expect(getSeasonStatus(undefined, 6)).toBeNull()
  })

  it('retourne null si moisSaison est un tableau vide', () => {
    expect(getSeasonStatus([], 6)).toBeNull()
  })

  // ── Pleinement de saison ─────────────────────────────────────────────────────

  it('retourne "in" si de saison ce mois et le mois prochain', () => {
    // Juin (6), disponible en juin et juillet
    expect(getSeasonStatus([5, 6, 7], 6)).toBe('in')
  })

  it('retourne "in" en décembre si disponible en décembre et janvier', () => {
    // Passage d'année : décembre (12) → prochain = janvier (1)
    expect(getSeasonStatus([11, 12, 1], 12)).toBe('in')
  })

  // ── Fin de saison ────────────────────────────────────────────────────────────

  it('retourne "ending" si de saison ce mois mais pas le mois prochain', () => {
    // Disponible uniquement en juin
    expect(getSeasonStatus([6], 6)).toBe('ending')
  })

  it('retourne "ending" en novembre si disponible en novembre mais pas décembre', () => {
    expect(getSeasonStatus([9, 10, 11], 11)).toBe('ending')
  })

  it('retourne "ending" en décembre si disponible en décembre mais pas janvier', () => {
    expect(getSeasonStatus([10, 11, 12], 12)).toBe('ending')
  })

  // ── Début de saison ──────────────────────────────────────────────────────────

  it('retourne "starting" si pas de saison ce mois mais le mois prochain oui', () => {
    // Pas disponible en mai, mais disponible en juin
    expect(getSeasonStatus([6, 7, 8], 5)).toBe('starting')
  })

  it('retourne "starting" en décembre si pas disponible en décembre mais en janvier', () => {
    // Passage d'année
    expect(getSeasonStatus([1, 2, 3], 12)).toBe('starting')
  })

  // ── Hors saison ─────────────────────────────────────────────────────────────

  it('retourne "out" si hors saison et pas de saison le mois prochain', () => {
    // Disponible uniquement en été, on est en janvier
    expect(getSeasonStatus([6, 7, 8], 1)).toBe('out')
  })

  it('retourne "out" si complètement hors saison', () => {
    expect(getSeasonStatus([3, 4, 5], 10)).toBe('out')
  })

  // ── Passage décembre/janvier ─────────────────────────────────────────────────

  it('calcule correctement le mois prochain en décembre (wrap 12→1)', () => {
    // De saison en janvier, on est en décembre → "starting"
    expect(getSeasonStatus([1], 12)).toBe('starting')
  })

  it('de saison toute l\'année retourne "in"', () => {
    const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    for (let month = 1; month <= 12; month++) {
      expect(getSeasonStatus(allMonths, month)).toBe('in')
    }
  })

  // ── Paramètre currentMonth par défaut ────────────────────────────────────────

  it('utilise le mois courant par défaut si currentMonth non fourni', () => {
    const currentMonth = new Date().getMonth() + 1
    const next = currentMonth === 12 ? 1 : currentMonth + 1
    // Disponible ce mois et le suivant → "in"
    const result = getSeasonStatus([currentMonth, next])
    expect(result).toBe('in')
  })
})
