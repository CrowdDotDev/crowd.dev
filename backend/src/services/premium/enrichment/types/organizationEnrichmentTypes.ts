import { CompanyEnrichmentParams, CompanyResponse } from 'peopledatalabs'

export type IEnrichmentResponse = CompanyResponse & { address?: any; geoLocation?: string }

export type EnrichmentParams = CompanyEnrichmentParams
export type IOrganizations = IOrganization[]

export interface IOrganization {
  id: string
  name: string
  tenantId?: string
  website?: string
  location?: string
  description?: IEnrichmentResponse['summary']
  employeeCountByCountry?: IEnrichmentResponse['employee_count_by_country']
  type?: IEnrichmentResponse['type']
  ticker?: IEnrichmentResponse['ticker']
  headline?: IEnrichmentResponse['headline']
  profiles?: IEnrichmentResponse['profiles']
  naics?: IEnrichmentResponse['naics']
  industry?: IEnrichmentResponse['industry']
  founded?: IEnrichmentResponse['founded']
  employees?: IEnrichmentResponse['size']
  twitter?: ISocialNetwork
  github?: ISocialNetwork
  linkedin?: ISocialNetwork
  crunchbase?: ISocialNetwork
  lastEnrichedAt?: Date
  geoLocation?: String
  address?: IEnrichmentResponse['location']
}

interface ISocialNetwork {
  url: string
  handle: string
}

export interface IEnrichableOrganization extends IOrganization {
  cachId: string
  tenantId: string
}
