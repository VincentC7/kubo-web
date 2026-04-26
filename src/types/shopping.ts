export type ShoppingItemSource = 'planning' | 'manual'

export interface ShoppingItem {
  id: string
  ingredientName: string
  quantity: number | null
  unit: string | null
  category: string | null
  checked: boolean
  source: ShoppingItemSource
}

export interface ShoppingList {
  id: string
  week: string
  items: ShoppingItem[]
}

export interface ShoppingResponse {
  data: ShoppingList | null
}

export interface CreateShoppingItem {
  week: string
  ingredientName: string
  quantity?: number
  unit?: string
  category?: string
}

export interface UpdateShoppingItem {
  checked?: boolean
  quantity?: number
  unit?: string
}
