export type Repo = {
  url: string
  name: string
  createdAt: string
  owner: string
  available?: boolean
}

export type Repos = Array<Repo>

export type Channel = {
  id: string
  name: string
  thread?: boolean
  new?: boolean
}

export type Channels = Array<Channel>

export type Endpoint = string

export type Endpoints = Array<Endpoint>

export type State = {
  endpoints: Endpoints
  endpoint: string
  page: string
}
