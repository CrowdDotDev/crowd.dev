export interface PageData<T> {
  rows: T[]
  count: number
  limit: number
  offset: number
}

export interface SearchCriteria {
  limit?: number
  offset?: number
}
