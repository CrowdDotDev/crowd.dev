export interface GlobalIntegrationsQuery {
  limit: number
  offset: number
  query: string
  platform?: string
  status: string[]
}

export interface GlobalIntegrationStatusCountQuery {
  platform?: string
}

export interface GlobalIntegrationStatusCount {
  status: string
  count: string | number
}
