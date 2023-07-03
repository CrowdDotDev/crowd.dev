export interface IIndexRequest<T> {
  id: string
  body: T
}

export interface ISearchHit<T> {
  _id: string

  _source?: T
}
