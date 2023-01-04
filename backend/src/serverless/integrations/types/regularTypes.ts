export type Repo = {
  url: string
  name: string
  createdAt: string
  owner: string
  available?: boolean
}

export type Repos = Array<Repo>

export type Endpoint = string

export type Endpoints = Array<Endpoint>

export type State = {
  endpoints: Endpoints
  endpoint: string
  page: string
}
