export interface IMemberEnrichmentDataSerp {
  linkedinUrl: string
}

export interface IMemberEnrichmentSerpApiResponse {
  organic_results: IMemberEnrichmentSerpApiResponseOrganicResult[]
  search_information: IMemberEnrichmentSerpApiResponseSearchInformation
}

export interface IMemberEnrichmentSerpApiResponseSearchInformation {
  query_displayed: string
  total_results: number
  time_taken_displayed: number
  organic_results_state: string
  spelling_fix?: string
  spelling_fix_type?: string
}

export interface IMemberEnrichmentSerpApiResponseOrganicResult {
  position: number
  title: string
  link: string
  redirect_link: string
  displayed_link: string
  favicon: string
  snippet: string
  snippet_highlighted_words: string[]
  sitelinks: {
    inline: IMemberEnrichmentSerpApiResponseOrganicResultSitelinkInline[]
  }
  source: string
}

export interface IMemberEnrichmentSerpApiResponseOrganicResultSitelinkInline {
  title: string
  link: string
}
