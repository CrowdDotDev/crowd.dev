export interface QueryInput {
  filter: any
  orderBy: any
  limit?: string | number
  offset?: string | number
  fields?: false | string | string[]
  include?: any
}

export interface QueryOutput {
  ['where']?: any
  ['having']?: any
  limit: number
  order: Array<string[]>
  offset: number
  attributes?: [string]
}
