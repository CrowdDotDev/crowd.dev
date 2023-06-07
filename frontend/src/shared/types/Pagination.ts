export interface Pagination<T>{
  count: number;
  limit: number;
  offset: number;
  rows: T[]
}
