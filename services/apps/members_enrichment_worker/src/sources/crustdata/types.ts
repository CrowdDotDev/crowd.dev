import { IMemberEnrichmentLinkedinScraperMetadata } from '../../types'

export interface IMemberEnrichmentCrustdataEmployer {
  employer_name: string
  employer_linkedin_id: string
  employer_linkedin_description?: string
  employer_company_id: number[]
  employee_position_id?: number
  employee_title: string
  employee_description?: string
  employee_location: string
  start_date: string
  end_date: string
}

export interface IMemberEnrichmentDataCrustdata {
  linkedin_profile_url: string
  linkedin_flagship_url: string
  name: string
  email: string | string[]
  title: string
  last_updated: string
  headline: string
  summary: string
  num_of_connections: number
  skills: string
  profile_picture_url: string
  twitter_handle: string
  languages: string[]
  all_employers: string[]
  past_employers: IMemberEnrichmentCrustdataEmployer[]
  current_employers: IMemberEnrichmentCrustdataEmployer[]
  all_employers_company_id: number[]
  all_titles: string[]
  all_schools: string[]
  all_degrees: string[]
  metadata: IMemberEnrichmentLinkedinScraperMetadata
}

export type IMemberEnrichmentCrustdataAPIResponse =
  | IMemberEnrichmentDataCrustdata
  | IMemberEnrichmentCrustdataAPIErrorResponse

export interface IMemberEnrichmentCrustdataAPIErrorResponse {
  error: string
  linkedin_profile_url: string
  last_tried_linkedin_enrichment_date: string
  did_last_linkedin_enrichment_succeed: boolean
}

export interface IMemberEnrichmentCrustdataRemainingCredits {
  credits: number
}
