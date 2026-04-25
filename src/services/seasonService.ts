import httpClient from './httpClient'
import type { SaisonItemDto, SaisonResponse } from '@/types/recipe'

/**
 * Whitelist des noms d'ingrédients bruts acceptés (forme normalisée : sans accents, minuscules).
 * Toute entrée de l'API qui ne correspond pas exactement à un de ces noms est rejetée.
 */
const CANONICAL_NAMES = new Set([
  // Légumes
  'artichaut',
  'asperge',
  'asperges blanches',
  'asperges vertes',
  'aubergine',
  'betterave',
  'blette',
  'brocoli',
  'carotte',
  'celeri',
  'celeri-branche',
  'celeri-rave',
  'champignon',
  'champignons de paris',
  'champignons blonds',
  'chou',
  'chou kale',
  'chou-fleur',
  'chou rouge',
  'chou blanc',
  'chou pointu',
  'chou chinois',
  'chou vert frise',
  'chou frise',
  'choux de bruxelles',
  'chou de bruxelles',
  'concombre',
  'courge',
  'courge butternut',
  'courgette',
  'echalote',
  'endive',
  'endives',
  'epinard',
  'epinards',
  'fenouil',
  'feve',
  'haricot vert',
  'haricots verts',
  'haricot coco',
  'mais',
  'mache',
  'navet',
  'oignon',
  'oignon rouge',
  'oignon jaune',
  'panais',
  'patate douce',
  'petit pois',
  'petits pois',
  'pois mange-tout',
  'poireau',
  'poivron',
  'poivron rouge',
  'poivron jaune',
  'poivron vert',
  'pomme de terre',
  'potimarron',
  'potiron',
  'radis',
  'radis noir',
  'rutabaga',
  'salade',
  'laitue',
  'topinambour',
  'tomate',
  // Fruits
  'abricot',
  'ananas',
  'avocat',
  'banane',
  'cassis',
  'cerise',
  'citron',
  'citron vert',
  'coing',
  'datte',
  'figue',
  'fraise',
  'framboise',
  'grenade',
  'groseille',
  'kaki',
  'kiwi',
  'mandarine',
  'clementine',
  'mangue',
  'melon',
  'mure',
  'myrtille',
  'nectarine',
  'orange',
  'pamplemousse',
  'pomelo',
  'papaye',
  'pasteque',
  'peche',
  'poire',
  'pomme',
  'prune',
  'pruneau',
  'raisin',
  'fruit de la passion',
])

/**
 * Alias : plusieurs formes de l'API qui désignent le même ingrédient
 * → on les fusionne sous une clé canonique unique.
 */
const ALIASES: Record<string, string> = {
  endives: 'endive',
  epinards: 'epinard',
  'choux de bruxelles': 'chou de bruxelles',
  'asperges blanches': 'asperge',
  'asperges vertes': 'asperge',
  'champignons de paris': 'champignon',
  'champignons blonds': 'champignon',
  'celeri-branche': 'celeri',
  'celeri-rave': 'celeri',
  'chou frise': 'chou',
  'chou vert frise': 'chou',
  'chou chinois': 'chou',
  'chou blanc': 'chou',
  'chou rouge': 'chou',
  'chou pointu': 'chou',
  'courge butternut': 'courge',
  potiron: 'potimarron',
  'petits pois': 'petit pois',
  'pois mange-tout': 'petit pois',
  'haricots verts': 'haricot vert',
  'oignon rouge': 'oignon',
  'oignon jaune': 'oignon',
  'poivron rouge': 'poivron',
  'poivron jaune': 'poivron',
  'poivron vert': 'poivron',
  'radis noir': 'radis',
  laitue: 'salade',
  mache: 'salade',
  clementine: 'mandarine',
  pomelo: 'pamplemousse',
  pruneau: 'prune',
  coing: 'poire',
  datte: 'raisin',
  mure: 'myrtille',
  cassis: 'myrtille',
  groseille: 'myrtille',
  papaye: 'mangue',
  kaki: 'orange',
  'haricot coco': 'haricot vert',
}

function normalizeKey(nom: string): string {
  return nom.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').trim()
}

function isCanonicalName(nom: string): boolean {
  const key = normalizeKey(nom)
  return CANONICAL_NAMES.has(key)
}

/** Retourne la clé dédupliquée (après alias) pour éviter les doublons visuels */
function dedupeKey(nom: string): string {
  const key = normalizeKey(nom)
  return ALIASES[key] ?? key
}

export interface SeasonData {
  fruits: SaisonItemDto[]
  legumes: SaisonItemDto[]
}

export async function getSeasonIngredients(mois?: number): Promise<SeasonData> {
  const params = mois !== undefined ? { mois } : {}
  const { data } = await httpClient.get<SaisonResponse>('/ingredients/saison', { params })

  const items: SaisonItemDto[] = Array.isArray(data.data) ? data.data : []

  // Filtre sur whitelist + déduplication par clé d'alias
  const seen = new Set<string>()
  const canonical = items.filter((item) => {
    if (!isCanonicalName(item.nom)) return false
    const key = dedupeKey(item.nom)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const fruits = canonical.filter((i) => i.type === 'fruit')
  const legumes = canonical.filter((i) => i.type === 'legume')

  return { fruits, legumes }
}
