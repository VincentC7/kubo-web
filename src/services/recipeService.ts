import httpClient from './httpClient'
import type {
  RecipeListItem,
  RecipeDetail,
  RecipeWithPrice,
  PaginatedResponse,
  RecetteListItemDto,
  RecetteDetailDto,
  ApiListResponse,
  IngredientDto,
  EtapeDto,
  NutritionDto,
} from '@/types/recipe'

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

function mapDetail(r: RecetteDetailDto): RecipeDetail {
  const nutritionRaw = Array.isArray(r.nutrition) ? r.nutrition : Object.values(r.nutrition ?? {})
  const nutrition: NutritionDto | undefined = nutritionRaw[0]

  const etapesRaw: EtapeDto[] = Array.isArray(r.etapes) ? r.etapes : Object.values(r.etapes ?? {})
  const steps = etapesRaw.flatMap((e) => e.instructions ?? [])

  const ingredientsRaw: IngredientDto[] = Array.isArray(r.ingredients)
    ? r.ingredients
    : Object.values(r.ingredients ?? {})
  const ingredients = ingredientsRaw.map((ing) => ({
    name: ing.nom,
    qty: [ing.quantite, ing.unite].filter(Boolean).join(' ') || ing.raw || '',
    price: 0,
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

  async getRecipeById(id: string): Promise<RecipeDetail> {
    const { data } = await httpClient.get<RecetteDetailDto>(`/api/recettes/${id}`)
    return mapDetail(data)
  },
}

export type { RecipeListItem, RecipeDetail, RecipeWithPrice, PaginatedResponse }
