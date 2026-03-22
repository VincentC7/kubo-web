export type SeasonStatus =
  | 'in' // de saison ce mois-ci
  | 'ending' // de saison ce mois-ci, mais plus le mois prochain
  | 'starting' // pas encore en saison, mais le sera le mois prochain
  | 'out' // hors saison (plus d'un mois d'écart)

export interface Ingredient {
  name: string
  qty: string
  price: number
  seasonStatus?: SeasonStatus | null
}

export interface Step {
  numero: number
  instructions: string[]
}

export interface RecipeListItem {
  id: string
  title: string
  sub: string
  img: string
  time: number
  kcal: number
  prot: number
  fat: number
  carb: number
  cat: string
  difficulty: string
  tags: string[]
  ingredients: Ingredient[]
  steps: Step[]
}

export interface RecipeWithPrice extends RecipeListItem {
  totalPrice: number
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  pages: number
}

// ---- Shapes brutes de l'API (DTO) ----

export interface RecetteListItemDto {
  uuid: string
  nom: string
  description: string | null
  image_url: string | null
  temps_total: number
  difficulte: string
  tags: string[]
}

export interface IngredientDto {
  nom: string
  quantite: string | null
  unite: string | null
  raw?: string
  type?: string
  mois_saison?: number[] | null
}

export interface EtapeDto {
  numero: number
  instructions: string[]
  astuce?: string | null
}

export interface NutritionDto {
  energie_kcal: number
  proteines: number
  matieres_grasses: number
  glucides: number
}

export interface RecetteDetailDto extends RecetteListItemDto {
  ingredients: IngredientDto[] | Record<string, IngredientDto>
  etapes: EtapeDto[] | Record<string, EtapeDto>
  nutrition: NutritionDto[] | Record<string, NutritionDto>
}

export interface ApiListResponse {
  data: RecetteListItemDto[]
  meta: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface CatalogueDto {
  semaine: string
  recettes: RecetteListItemDto[] | Record<string, RecetteListItemDto>
  meta: {
    total: number
    page: number
    limit: number
    pages: number
    catalogue_size: number
  }
}

export interface CatalogueResponse extends PaginatedResponse<RecipeListItem> {
  week: string
  selectionSize: number
}
