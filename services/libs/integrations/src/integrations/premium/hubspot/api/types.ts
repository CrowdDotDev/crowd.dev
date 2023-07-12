export interface IPaginatedResponse<T> {
  elements: T[]
  after?: string
}
