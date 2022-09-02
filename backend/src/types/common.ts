export interface PageData<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}
