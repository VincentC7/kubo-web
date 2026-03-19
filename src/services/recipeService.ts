import httpClient from './httpClient'
import type {
  RecipeListItem,
  RecipeWithPrice,
  PaginatedResponse,
  RecetteListItemDto,
  ApiListResponse,
} from '@/types/recipe'

// ---- Mapper DTO → modèle interne ----

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
}
export type { RecipeListItem, RecipeWithPrice, PaginatedResponse }
