import httpClient from './httpClient'
import type {
  RecipeListItem,
  RecipeWithPrice,
  PaginatedResponse,
  RecetteListItemDto,
  RecetteDetailDto,
  IngredientDto,
  EtapeDto,
  NutritionDto,
  ApiListResponse,
} from '@/types/recipe'

// ---- Helpers DTO ----

function toArray<T>(val: T[] | Record<string, T> | undefined): T[] {
  if (!val) return []
  return Array.isArray(val) ? val : Object.values(val)
}

// ---- Mappers DTO → modèle interne ----

function mapListItem(r: RecetteListItemDto): RecipeListItem {
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

function mapDetail(r: RecetteDetailDto): RecipeListItem {
  const nutrition = toArray<NutritionDto>(r.nutrition)[0]
  const ingredients = toArray<IngredientDto>(r.ingredients).map((ing) => ({
    name: ing.nom,
    qty: [ing.quantite, ing.unite].filter(Boolean).join(' ') || (ing.raw ?? ''),
    price: 0,
  }))
  const steps = toArray<EtapeDto>(r.etapes).map((e) => ({
    numero: e.numero,
    instructions: e.instructions,
  }))

  return {
    ...mapListItem(r),
    kcal: nutrition?.energie_kcal ?? 0,
    prot: nutrition?.proteines ?? 0,
    fat: nutrition?.matieres_grasses ?? 0,
    carb: nutrition?.glucides ?? 0,
    ingredients,
    steps,
  }
}

// ---- Service ----

export const recipeService = {
  async getRecipes(page = 1, limit = 20): Promise<PaginatedResponse<RecipeListItem>> {
    const { data } = await httpClient.get<ApiListResponse>('/api/recettes', {
      params: { page, limit },
    })
    return {
      items: data.data.map(mapListItem),
      page: data.meta.page,
      pages: data.meta.pages,
    }
  },

  async getRecipeById(id: string): Promise<RecipeListItem> {
    const { data } = await httpClient.get<RecetteDetailDto>(`/api/recettes/${id}`)
    return mapDetail(data)
  },
}
export type { RecipeListItem, RecipeWithPrice, PaginatedResponse }
