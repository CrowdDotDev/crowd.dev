export interface IMemberEnrichmentDataSerp {
  linkedinUrl: string
}

export interface IMemberEnrichmentSerpApiResponse {
  organic_results: IMemberEnrichmentSerpApiResponseOrganicResult[]
  search_information: IMemberEnrichmentSerpApiResponseSearchInformation
}

export interface ISerpApiAccountUsageData {
  account_id: string
  api_key: string
  account_email: string
  account_status: string
  plan_id: string
  plan_name: string
  plan_monthly_price: number
  searches_per_month: number
  plan_searches_left: number
  extra_credits: number
  total_searches_left: number
  this_month_usage: number
  this_hour_searches: number
  last_hour_searches: number
  account_rate_limit_per_hour: number
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
