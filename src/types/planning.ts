export interface PlanningRecetteSummary {
  id: string
  nom: string
  imageUrl?: string
  tempsTotal: number
  difficulte: string
}

export interface PlanningEntry {
  id: string
  recette: PlanningRecetteSummary
  week: string // 'YYYY-Www'
  portions: number
  done: boolean
}

export interface PlanningMeta {
  week: string
  weekStart: string // 'YYYY-MM-DD'
  weekEnd: string // 'YYYY-MM-DD'
}

export interface PlanningResponse {
  data: PlanningEntry[]
  meta: PlanningMeta
}

export interface CreatePlanningEntry {
  recetteId: string
  week: string
  portions: number
}

export interface UpdatePlanningEntry {
  portions?: number
  done?: boolean
}
