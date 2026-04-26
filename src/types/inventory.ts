export type InventoryItemStatus = 'ok' | 'expiring_soon' | 'expired' | null

export interface InventoryItem {
  id: string
  name: string
  quantity: number
  unit: string | null
  category: string | null
  expiresAt: string | null // 'YYYY-MM-DD'
  daysUntilExpiry: number | null
  status: InventoryItemStatus
}

export interface InventoryMeta {
  total: number
  expiringSoon: number
  expired: number
}

export interface InventoryResponse {
  data: InventoryItem[]
  meta: InventoryMeta
}

export interface CreateInventoryItem {
  name: string
  quantity: number
  unit?: string
  category?: string
  expiresAt?: string
}

export type UpdateInventoryItem = Partial<CreateInventoryItem>

export interface InventoryFilters {
  category?: string
  expiring_soon?: boolean
}
