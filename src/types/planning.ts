export interface WeekEntry {
  selected: boolean
  done: boolean
}

export type WeeklyData = Record<string, Record<string, WeekEntry>>
