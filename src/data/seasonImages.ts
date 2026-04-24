/**
 * Mapping nom normalisé → { url: asset local OpenMoji, emoji: fallback }
 * pour les fruits et légumes de saison.
 * Normalisation : toLowerCase() + suppression des diacritiques + trim.
 *
 * Icônes : OpenMoji 15 (CC BY-SA 4.0) — https://openmoji.org
 */

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').trim()
}

interface SeasonImageEntry {
  url: string
  emoji: string
}

// Imports statiques Vite — résolus au build, pas de requête réseau
const IMGS: Record<string, string> = {
  // ── Légumes ──
  artichaut: new URL('../assets/icons/season/artichaut.svg', import.meta.url).href,
  asperge: new URL('../assets/icons/season/asperge.svg', import.meta.url).href,
  aubergine: new URL('../assets/icons/season/aubergine.svg', import.meta.url).href,
  betterave: new URL('../assets/icons/season/betterave.svg', import.meta.url).href,
  blette: new URL('../assets/icons/season/blette.svg', import.meta.url).href,
  brocoli: new URL('../assets/icons/season/brocoli.svg', import.meta.url).href,
  carotte: new URL('../assets/icons/season/carotte.svg', import.meta.url).href,
  celeri: new URL('../assets/icons/season/celeri.svg', import.meta.url).href,
  champignon: new URL('../assets/icons/season/champignon.svg', import.meta.url).href,
  chou: new URL('../assets/icons/season/chou.svg', import.meta.url).href,
  'chou-fleur': new URL('../assets/icons/season/chou-fleur.svg', import.meta.url).href,
  'choux de bruxelles': new URL('../assets/icons/season/choux-de-bruxelles.svg', import.meta.url)
    .href,
  concombre: new URL('../assets/icons/season/concombre.svg', import.meta.url).href,
  courge: new URL('../assets/icons/season/courge.svg', import.meta.url).href,
  butternut: new URL('../assets/icons/season/courge.svg', import.meta.url).href,
  courgette: new URL('../assets/icons/season/courgette.svg', import.meta.url).href,
  endive: new URL('../assets/icons/season/endive.svg', import.meta.url).href,
  epinard: new URL('../assets/icons/season/epinard.svg', import.meta.url).href,
  fenouil: new URL('../assets/icons/season/fenouil.svg', import.meta.url).href,
  feve: new URL('../assets/icons/season/feve.svg', import.meta.url).href,
  'haricot vert': new URL('../assets/icons/season/haricot-vert.svg', import.meta.url).href,
  mais: new URL('../assets/icons/season/mais.svg', import.meta.url).href,
  mache: new URL('../assets/icons/season/salade.svg', import.meta.url).href,
  navet: new URL('../assets/icons/season/navet.svg', import.meta.url).href,
  oignon: new URL('../assets/icons/season/oignon.svg', import.meta.url).href,
  echalote: new URL('../assets/icons/season/oignon.svg', import.meta.url).href,
  panais: new URL('../assets/icons/season/panais.svg', import.meta.url).href,
  'patate douce': new URL('../assets/icons/season/patate-douce.svg', import.meta.url).href,
  'petit pois': new URL('../assets/icons/season/petit-pois.svg', import.meta.url).href,
  'petits pois': new URL('../assets/icons/season/petit-pois.svg', import.meta.url).href,
  pois: new URL('../assets/icons/season/petit-pois.svg', import.meta.url).href,
  poireau: new URL('../assets/icons/season/poireau.svg', import.meta.url).href,
  poivron: new URL('../assets/icons/season/poivron.svg', import.meta.url).href,
  'pomme de terre': new URL('../assets/icons/season/pomme-de-terre.svg', import.meta.url).href,
  potimarron: new URL('../assets/icons/season/potimarron.svg', import.meta.url).href,
  potiron: new URL('../assets/icons/season/potimarron.svg', import.meta.url).href,
  radis: new URL('../assets/icons/season/radis.svg', import.meta.url).href,
  rutabaga: new URL('../assets/icons/season/rutabaga.svg', import.meta.url).href,
  salade: new URL('../assets/icons/season/salade.svg', import.meta.url).href,
  laitue: new URL('../assets/icons/season/salade.svg', import.meta.url).href,
  tomate: new URL('../assets/icons/season/pomme.svg', import.meta.url).href,
  topinambour: new URL('../assets/icons/season/topinambour.svg', import.meta.url).href,
  // ── Fruits ──
  abricot: new URL('../assets/icons/season/abricot.svg', import.meta.url).href,
  ananas: new URL('../assets/icons/season/ananas.svg', import.meta.url).href,
  avocat: new URL('../assets/icons/season/avocat.svg', import.meta.url).href,
  banane: new URL('../assets/icons/season/banane.svg', import.meta.url).href,
  cassis: new URL('../assets/icons/season/cassis.svg', import.meta.url).href,
  cerise: new URL('../assets/icons/season/cerise.svg', import.meta.url).href,
  citron: new URL('../assets/icons/season/citron.svg', import.meta.url).href,
  'citron vert': new URL('../assets/icons/season/citron-vert.svg', import.meta.url).href,
  coing: new URL('../assets/icons/season/poire.svg', import.meta.url).href,
  datte: new URL('../assets/icons/season/raisin.svg', import.meta.url).href,
  figue: new URL('../assets/icons/season/figue.svg', import.meta.url).href,
  fraise: new URL('../assets/icons/season/fraise.svg', import.meta.url).href,
  framboise: new URL('../assets/icons/season/framboise.svg', import.meta.url).href,
  grenade: new URL('../assets/icons/season/grenade.svg', import.meta.url).href,
  groseille: new URL('../assets/icons/season/groseille.svg', import.meta.url).href,
  kaki: new URL('../assets/icons/season/kaki.svg', import.meta.url).href,
  kiwi: new URL('../assets/icons/season/kiwi.svg', import.meta.url).href,
  mandarine: new URL('../assets/icons/season/mandarine.svg', import.meta.url).href,
  clementine: new URL('../assets/icons/season/mandarine.svg', import.meta.url).href,
  mangue: new URL('../assets/icons/season/mangue.svg', import.meta.url).href,
  melon: new URL('../assets/icons/season/melon.svg', import.meta.url).href,
  mure: new URL('../assets/icons/season/mure.svg', import.meta.url).href,
  myrtille: new URL('../assets/icons/season/myrtille.svg', import.meta.url).href,
  nectarine: new URL('../assets/icons/season/nectarine.svg', import.meta.url).href,
  orange: new URL('../assets/icons/season/orange.svg', import.meta.url).href,
  pamplemousse: new URL('../assets/icons/season/pamplemousse.svg', import.meta.url).href,
  pomelo: new URL('../assets/icons/season/pamplemousse.svg', import.meta.url).href,
  papaye: new URL('../assets/icons/season/papaye.svg', import.meta.url).href,
  pasteque: new URL('../assets/icons/season/pasteque.svg', import.meta.url).href,
  peche: new URL('../assets/icons/season/peche.svg', import.meta.url).href,
  poire: new URL('../assets/icons/season/poire.svg', import.meta.url).href,
  pomme: new URL('../assets/icons/season/pomme.svg', import.meta.url).href,
  prune: new URL('../assets/icons/season/prune.svg', import.meta.url).href,
  pruneau: new URL('../assets/icons/season/prune.svg', import.meta.url).href,
  raisin: new URL('../assets/icons/season/raisin.svg', import.meta.url).href,
}

// Emojis fallback par clé normalisée
const EMOJIS: Record<string, string> = {
  artichaut: '🌿',
  asperge: '🌿',
  aubergine: '🍆',
  betterave: '🫀',
  blette: '🥬',
  brocoli: '🥦',
  carotte: '🥕',
  celeri: '🌿',
  champignon: '🍄',
  chou: '🥬',
  'chou-fleur': '🥦',
  'choux de bruxelles': '🥦',
  concombre: '🥒',
  courge: '🎃',
  butternut: '🎃',
  courgette: '🥒',
  endive: '🥬',
  epinard: '🥬',
  fenouil: '🌿',
  feve: '🫛',
  'haricot vert': '🫛',
  mais: '🌽',
  mache: '🥬',
  navet: '🌿',
  oignon: '🧅',
  echalote: '🧅',
  panais: '🌿',
  'patate douce': '🍠',
  'petit pois': '🫛',
  'petits pois': '🫛',
  pois: '🫛',
  poireau: '🌿',
  poivron: '🫑',
  'pomme de terre': '🥔',
  potimarron: '🎃',
  potiron: '🎃',
  radis: '🌿',
  rutabaga: '🌿',
  salade: '🥗',
  laitue: '🥗',
  tomate: '🍅',
  topinambour: '🌿',
  abricot: '🍑',
  ananas: '🍍',
  avocat: '🥑',
  banane: '🍌',
  cassis: '🫐',
  cerise: '🍒',
  citron: '🍋',
  'citron vert': '🍋',
  coing: '🍐',
  datte: '🌴',
  figue: '🍈',
  fraise: '🍓',
  framboise: '🫐',
  grenade: '🍎',
  groseille: '🫐',
  kaki: '🍊',
  kiwi: '🥝',
  mandarine: '🍊',
  clementine: '🍊',
  mangue: '🥭',
  melon: '🍈',
  mure: '🫐',
  myrtille: '🫐',
  nectarine: '🍑',
  orange: '🍊',
  pamplemousse: '🍊',
  pomelo: '🍊',
  papaye: '🥭',
  pasteque: '🍉',
  peche: '🍑',
  poire: '🍐',
  pomme: '🍎',
  prune: '🍑',
  pruneau: '🍑',
  raisin: '🍇',
}

// Table normalisée (calculée une seule fois)
const ICON_MAP: Record<string, SeasonImageEntry> = Object.fromEntries(
  Object.entries(IMGS).map(([k, url]) => [normalize(k), { url, emoji: EMOJIS[k] ?? '🌿' }]),
)

export function getSeasonImage(nom: string, type: 'legume' | 'fruit'): SeasonImageEntry {
  const key = normalize(nom)

  // Recherche exacte
  if (ICON_MAP[key]) return ICON_MAP[key]

  // Recherche partielle : le nom contient une clé connue (ou l'inverse)
  for (const [k, entry] of Object.entries(ICON_MAP)) {
    if (key.includes(k) || k.includes(key)) return entry
  }

  // Fallback par type
  return {
    url: '',
    emoji: type === 'fruit' ? '🍎' : '🌿',
  }
}
