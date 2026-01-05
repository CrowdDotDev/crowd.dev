export interface IOrganizationEnrichmentDataInternalAPI {
  name: string
  description?: string
  location?: string
  type?: string
  logo?: string
  primary_domain?: string
  emails?: string[]
  domains?: string[]
  identities?: IOrganizationIdentitiesInternalAPI
  founded_year?: number
  employee_count?: number
  revenue?: string
  parent_company?: {
    name?: string
    url?: string
  }
}

export interface IOrganizationIdentitiesInternalAPI {
  linkedin?: string[]
  twitter?: string[]
  crunchbase?: string
}

export interface IOrganizationEnrichmentDataInternalAPIResponse {
  content: {
    profile: IOrganizationEnrichmentDataInternalAPI
    research_confidence?: 'low' | 'medium' | 'high'
  }
}
