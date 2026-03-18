/**
 * kubo — Service API
 * Recettes : vrais appels vers l'API REST Kubo.
 * Utilisateur : données mockées (endpoint non disponible pour l'instant).
 */
import httpClient from './httpClient.js'

// ---- Données mockées (utilisateur) ----

const MOCK_USER = {
  id: 1,
  name: 'Jean Dupont',
  initials: 'JD',
  role: 'Chef Kubo',
  goalKcal: 2000,
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
}

// ---- Mapping schéma API → schéma front ----

/**
 * Normalise un item de liste (RecetteListItemDto) vers le format interne du front.
 * Les champs absents (kcal, prot, fat, carb, price) sont mis à 0 — ils sont
 * renseignés lors du chargement du détail.
 */
function mapListItem(r) {
  return {
    id: r.uuid,
    title: r.nom,
    sub: r.description ?? '',
    img: r.image_url ?? '',
    time: r.temps_total ?? 0,
    kcal: 0,
    prot: 0,
    fat: 0,
    carb: 0,
    cat: r.tags?.[0] ?? 'Autre',
    difficulty: r.difficulte ?? 'Facile',
    tags: r.tags ?? [],
    ingredients: [],
    steps: [],
  }
}

/**
 * Normalise un détail complet (RecetteDetailDto) vers le format interne du front.
 */
function mapDetail(r) {
  // Nutrition : on prend le premier contexte disponible (ex. "par portion")
  const nutrition = Array.isArray(r.nutrition)
    ? r.nutrition[0]
    : Object.values(r.nutrition ?? {})[0]

  // Étapes : tableau d'EtapeDto → tableau de strings
  const etapesRaw = Array.isArray(r.etapes) ? r.etapes : Object.values(r.etapes ?? {})
  const steps = etapesRaw.flatMap((e) => e.instructions ?? [])

  // Ingrédients : tableau ou objet d'IngredientDto → format { name, qty, price }
  const ingredientsRaw = Array.isArray(r.ingredients)
    ? r.ingredients
    : Object.values(r.ingredients ?? {})
  const ingredients = ingredientsRaw.map((ing) => ({
    name: ing.nom,
    qty: [ing.quantite, ing.unite].filter(Boolean).join(' ') || ing.raw,
    price: 0, // non disponible dans l'API
  }))

  return {
    id: r.uuid,
    title: r.nom,
    sub: r.description ?? '',
    img: r.image_url ?? '',
    time: r.temps_total ?? 0,
    kcal: Math.round(nutrition?.energie_kcal ?? 0),
    prot: Math.round(nutrition?.proteines ?? 0),
    fat: Math.round(nutrition?.matieres_grasses ?? 0),
    carb: Math.round(nutrition?.glucides ?? 0),
    cat: r.tags?.[0] ?? 'Autre',
    difficulty: r.difficulte ?? 'Facile',
    tags: r.tags ?? [],
    ingredients,
    steps,
  }
}

// ---- Endpoints ----

export const apiService = {
  /** Récupère le profil utilisateur courant (mocké) */
  async getUser() {
    return { ...MOCK_USER }
  },

  /** Récupère une page de recettes. Retourne { items, total, page, limit }. */
  async getRecipes(page = 1, limit = 20) {
    const { data } = await httpClient.get('/api/recettes', {
      params: { page, limit },
    })
    return {
      items: data.data.map(mapListItem),
      page: data.meta.page,
      pages: data.meta.pages,
    }
  },

  /** Récupère le détail complet d'une recette par son UUID */
  async getRecipeById(id) {
    const { data } = await httpClient.get(`/api/recettes/${id}`)
    return mapDetail(data)
  },

  /** Sauvegarde le profil utilisateur (mocké) */
  async saveUser(payload) {
    Object.assign(MOCK_USER, payload)
    return { ...MOCK_USER }
  },
}
