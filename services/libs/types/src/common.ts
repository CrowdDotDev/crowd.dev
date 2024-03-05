export interface PageData<T> {
  rows: T[]
  count: number
  limit: number
  offset: number
}

export interface QueryData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter?: any
  orderBy?: string
  limit?: number
  offset?: number
}

export interface SearchCriteria {
  limit?: number
  offset?: number
}

export enum AuthProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
}
