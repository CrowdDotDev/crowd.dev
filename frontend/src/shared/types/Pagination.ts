export interface Pagination<T>{
  count: number;
  total?: number;
  limit: number;
  offset: number;
  rows: T[]
}
