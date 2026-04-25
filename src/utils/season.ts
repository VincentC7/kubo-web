import type { SeasonStatus } from '@/types/recipe'

/**
 * Calcule le statut de saisonnalité d'un ingrédient pour un mois donné.
 *
 * @param moisSaison  Tableau des mois (1–12) où l'ingrédient est de saison, ou null
 * @param currentMonth Mois de référence (1–12), défaut = mois courant
 * @returns
 *   'in'       — de saison ce mois-ci (et encore le mois prochain)
 *   'ending'   — de saison ce mois-ci, mais plus le mois prochain (bientôt fini)
 *   'starting' — hors saison ce mois-ci, mais en saison le mois prochain (arrive bientôt)
 *   'out'      — hors saison, à plus d'un mois d'écart
 *   null       — pas de données de saisonnalité (épices, viandes…)
 */
export function getSeasonStatus(
  moisSaison: number[] | null | undefined,
  currentMonth: number = new Date().getMonth() + 1,
): SeasonStatus | null {
  if (!moisSaison || moisSaison.length === 0) return null

  const next = currentMonth === 12 ? 1 : currentMonth + 1
  const isNow = moisSaison.includes(currentMonth)
  const isNext = moisSaison.includes(next)

  if (isNow && !isNext) return 'ending'
  if (isNow) return 'in'
  if (!isNow && isNext) return 'starting'
  return 'out'
}
