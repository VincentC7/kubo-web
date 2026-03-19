export interface Ingredient {
  name: string
  qty: string
  price: number
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
