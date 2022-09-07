export interface PageData<T> {
  rows: T[]
  count: number
  limit: number
  offset: number
}
