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

export interface ManyToManyType {
  [key: string]: {
    table: string
    relationTable: {
      name: string
      from: string
      to: string
    }
  }
}
